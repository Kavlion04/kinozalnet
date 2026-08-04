import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type FavoriteRow = { movie_id: string; created_at: string };
export type HistoryRow = {
  movie_id: string;
  position_seconds: number;
  duration_seconds: number | null;
  completed: boolean;
  updated_at: string;
};
export type ProfileDTO = { id: string; display_name: string | null; avatar_url: string | null };

export const listMyFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FavoriteRow[]> => {
    const { data, error } = await (context.supabase.from("favorites") as any)
      .select("movie_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as FavoriteRow[];
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ movie_id: z.string().uuid(), on: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sb = context.supabase as any;
    if (data.on) {
      const { error } = await sb
        .from("favorites")
        .upsert(
          { user_id: context.userId, movie_id: data.movie_id },
          { onConflict: "user_id,movie_id" },
        );
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from("favorites")
        .delete()
        .eq("user_id", context.userId)
        .eq("movie_id", data.movie_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listMyHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HistoryRow[]> => {
    const { data, error } = await (context.supabase.from("watch_history") as any)
      .select("movie_id, position_seconds, duration_seconds, completed, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as HistoryRow[];
  });

export const saveProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        movie_id: z.string().uuid(),
        position_seconds: z.number().min(0).max(100000),
        duration_seconds: z.number().min(0).max(100000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const completed =
      !!data.duration_seconds && data.duration_seconds > 0
        ? data.position_seconds / data.duration_seconds > 0.92
        : false;
    const { error } = await (context.supabase.from("watch_history") as any).upsert(
      {
        user_id: context.userId,
        movie_id: data.movie_id,
        position_seconds: Math.floor(data.position_seconds),
        duration_seconds: data.duration_seconds ? Math.floor(data.duration_seconds) : null,
        completed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,movie_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearMyHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { error } = await (context.supabase.from("watch_history") as any)
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileDTO> => {
    const { data } = await (context.supabase.from("profiles") as any)
      .select("id, display_name, avatar_url")
      .eq("id", context.userId)
      .maybeSingle();
    return (data as ProfileDTO) ?? { id: context.userId, display_name: null, avatar_url: null };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        display_name: z.string().trim().max(60).optional().nullable(),
        avatar_url: z.string().trim().url().max(500).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await (context.supabase.from("profiles") as any).upsert(
      {
        id: context.userId,
        display_name: data.display_name || null,
        avatar_url: data.avatar_url || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
