import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SiteStatsDTO = {
  movies: number;
  moviesWithVideo: number;
  genres: number;
  users: number;
  comments: number;
  favorites: number;
  watchSessions: number;
  telegramSubscribers: number;
  topFavorites: { id: string; title: string; count: number }[];
  topWatched: { id: string; title: string; count: number }[];
  byType: { type: string; count: number }[];
};

export const getSiteStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteStatsDTO> => {
    const sb = context.supabase as any;
    const { data: isAdmin } = await sb.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("Faqat adminlar uchun");

    const count = async (table: string) => {
      const { count: c } = await sb.from(table).select("id", { count: "exact", head: true });
      return c ?? 0;
    };

    const [movies, genres, users, comments, favorites, watchSessions, subscribers] =
      await Promise.all([
        count("movies"),
        count("genres"),
        count("profiles"),
        count("comments"),
        count("favorites"),
        count("watch_history"),
        count("telegram_subscribers"),
      ]);

    const { data: movieRows } = await sb
      .from("movies")
      .select("id, title, type, video_url, full_youtube_id")
      .limit(2000);
    const all: any[] = movieRows ?? [];
    const titles = new Map<string, string>(all.map((m) => [m.id, m.title]));
    const moviesWithVideo = all.filter((m) => m.video_url || m.full_youtube_id).length;

    const typeMap = new Map<string, number>();
    all.forEach((m) => typeMap.set(m.type, (typeMap.get(m.type) ?? 0) + 1));

    const tally = async (table: string) => {
      const { data } = await sb.from(table).select("movie_id").limit(5000);
      const m = new Map<string, number>();
      (data ?? []).forEach((r: any) => m.set(r.movie_id, (m.get(r.movie_id) ?? 0) + 1));
      return Array.from(m.entries())
        .map(([id, c]) => ({ id, title: titles.get(id) ?? "—", count: c }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    };

    const [topFavorites, topWatched] = await Promise.all([
      tally("favorites"),
      tally("watch_history"),
    ]);

    return {
      movies,
      moviesWithVideo,
      genres,
      users,
      comments,
      favorites,
      watchSessions,
      telegramSubscribers: subscribers,
      topFavorites,
      topWatched,
      byType: Array.from(typeMap.entries())
        .map(([type, c]) => ({ type, count: c }))
        .sort((a, b) => b.count - a.count),
    };
  });
