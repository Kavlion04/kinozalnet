import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const MOVIE_TYPES = ["Film", "Anime", "K-Drama", "Multfilm", "Serial", "Hujjatli"] as const;
export type MovieType = (typeof MOVIE_TYPES)[number];

function serverClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type MovieDTO = {
  id: string;
  title: string;
  original_title: string | null;
  description: string | null;
  year: number | null;
  genre: string[];
  type: string;
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_youtube_id: string | null;
  full_youtube_id: string | null;
  video_url: string | null;
  subtitles_url: string | null;
  trailer_url: string | null;
  cast_list: string[];
  rating: number | null;
  duration_minutes: number | null;
  created_at: string | null;
};

export type CommentDTO = {
  id: string;
  movie_id: string;
  nickname: string;
  body: string;
  created_at: string;
};

export type GenreDTO = { id: string; name: string; slug: string };

const rowToDto = (r: any): MovieDTO => ({
  id: r.id,
  title: r.title,
  original_title: r.original_title,
  description: r.description,
  year: r.year,
  genre: r.genre ?? [],
  type: r.type ?? "Film",
  poster_url: r.poster_url,
  backdrop_url: r.backdrop_url,
  trailer_youtube_id: r.trailer_youtube_id,
  full_youtube_id: r.full_youtube_id ?? null,
  video_url: r.video_url ?? null,
  subtitles_url: r.subtitles_url ?? null,
  trailer_url: r.trailer_url ?? null,
  cast_list: r.cast_list ?? [],
  rating: r.rating != null ? Number(r.rating) : null,
  duration_minutes: r.duration_minutes,
  created_at: r.created_at ?? null,
});

export const listMovies = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        q: z.string().optional().default(""),
        genre: z.string().optional().default(""),
        type: z.string().optional().default(""),
        year: z.number().int().optional(),
        sort: z.string().optional().default("rating"),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<MovieDTO[]> => {
    const sb = serverClient();
    let query = sb.from("movies").select("*").limit(300);
    if (data.q) query = query.ilike("title", `%${data.q}%`);
    if (data.genre) query = query.contains("genre", [data.genre]);
    if (data.type) query = (query as any).eq("type", data.type);
    if (data.year) query = query.eq("year", data.year);
    if (data.sort === "year") query = query.order("year", { ascending: false, nullsFirst: false });
    else if (data.sort === "title") query = query.order("title", { ascending: true });
    else if (data.sort === "newest") query = query.order("created_at", { ascending: false });
    else query = query.order("rating", { ascending: false, nullsFirst: false });
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(rowToDto);
  });

export const listMoviesByIds = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ ids: z.array(z.string()).max(50) }).parse(input))
  .handler(async ({ data }): Promise<MovieDTO[]> => {
    if (data.ids.length === 0) return [];
    const sb = serverClient();
    const { data: rows, error } = await sb.from("movies").select("*").in("id", data.ids);
    if (error) throw new Error(error.message);
    return (rows ?? []).map(rowToDto);
  });

export const getMovie = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<MovieDTO | null> => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("movies")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? rowToDto(row) : null;
  });

export const listGenres = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => {
  const sb = serverClient();
  const [{ data: rows }, { data: table }] = await Promise.all([
    sb.from("movies").select("genre"),
    (sb.from("genres") as any).select("name"),
  ]);
  const set = new Set<string>();
  (table ?? []).forEach((g: any) => set.add(g.name));
  (rows ?? []).forEach((r: any) => (r.genre ?? []).forEach((g: string) => set.add(g)));
  return Array.from(set).sort();
});

/** Admin-managed genre rows (with ids), for the dashboard. */
export const listGenreRows = createServerFn({ method: "GET" }).handler(
  async (): Promise<GenreDTO[]> => {
    const sb = serverClient();
    const { data, error } = await (sb.from("genres") as any).select("id, name, slug").order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as GenreDTO[];
  },
);

const movieFields = {
  title: z.string().min(1).max(200),
  original_title: z.string().max(200).optional().nullable(),
  description: z.string().max(4000).optional().nullable(),
  year: z.number().int().min(1888).max(2100).optional().nullable(),
  genre: z.array(z.string().max(50)).max(10).default([]),
  cast_list: z.array(z.string().max(80)).max(30).default([]),
  type: z.string().max(30).optional().default("Film"),
  poster_url: z.string().max(600).optional().nullable(),
  backdrop_url: z.string().max(600).optional().nullable(),
  trailer_youtube_id: z.string().max(30).optional().nullable(),
  full_youtube_id: z.string().max(30).optional().nullable(),
  video_url: z.string().max(600).optional().nullable(),
  subtitles_url: z.string().max(600).optional().nullable(),
  trailer_url: z.string().max(600).optional().nullable(),
  rating: z.number().min(0).max(10).optional().nullable(),
  duration_minutes: z.number().int().min(1).max(1000).optional().nullable(),
};

async function ensureAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (isAdmin !== true) throw new Error("Faqat adminlar uchun");
}

export const addMovie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object(movieFields).parse(input))
  .handler(async ({ data, context }): Promise<{ id: string; notified: number }> => {
    await ensureAdmin(context as any);
    const { data: row, error } = await (context.supabase.from("movies") as any)
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    let notified = 0;
    try {
      const { notifyNewMovie } = await import("@/lib/telegram.server");
      notified = await notifyNewMovie({
        id: row.id,
        title: data.title,
        year: data.year ?? null,
        type: data.type ?? "Film",
        hasVideo: Boolean(data.video_url || data.full_youtube_id),
      });
    } catch (e) {
      console.error("Telegram broadcast failed", e);
    }
    return { id: row.id, notified };
  });

export const updateMovie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), ...movieFields }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    await ensureAdmin(context as any);
    const { id, ...patch } = data;
    const { error } = await (context.supabase.from("movies") as any).update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { id };
  });

export const deleteMovie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensureAdmin(context as any);
    const { error } = await (context.supabase.from("movies") as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createGenre = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ name: z.string().trim().min(1).max(50) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensureAdmin(context as any);
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
      .replace(/^-+|-+$/g, "");
    const { error } = await (context.supabase.from("genres") as any).upsert(
      { name: data.name, slug },
      { onConflict: "slug" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGenre = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await ensureAdmin(context as any);
    const { error } = await (context.supabase.from("genres") as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listComments = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ movie_id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<CommentDTO[]> => {
    const sb = serverClient();
    const { data: rows, error } = await (sb.from("comments") as any)
      .select("*")
      .eq("movie_id", data.movie_id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []) as CommentDTO[];
  });

export const addComment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        movie_id: z.string().uuid(),
        nickname: z.string().trim().min(1).max(40),
        body: z.string().trim().min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<CommentDTO> => {
    const sb = serverClient();
    const { data: row, error } = await (sb.from("comments") as any)
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as CommentDTO;
  });
