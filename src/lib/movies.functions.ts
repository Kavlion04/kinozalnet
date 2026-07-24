import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
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
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
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
  rating: number | null;
  duration_minutes: number | null;
};

export type CommentDTO = {
  id: string;
  movie_id: string;
  nickname: string;
  body: string;
  created_at: string;
};

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
  rating: r.rating != null ? Number(r.rating) : null,
  duration_minutes: r.duration_minutes,
});

export const listMovies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
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
    else query = query.order("rating", { ascending: false, nullsFirst: false });
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(rowToDto);
  });

export const listMoviesByIds = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ ids: z.array(z.string()).max(50) }).parse(input))
  .handler(async ({ data }): Promise<MovieDTO[]> => {
    if (data.ids.length === 0) return [];
    const sb = serverClient();
    const { data: rows, error } = await sb.from("movies").select("*").in("id", data.ids);
    if (error) throw new Error(error.message);
    return (rows ?? []).map(rowToDto);
  });

export const getMovie = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }): Promise<MovieDTO | null> => {
    const sb = serverClient();
    const { data: row, error } = await sb.from("movies").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row ? rowToDto(row) : null;
  });

export const listGenres = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => {
  const sb = serverClient();
  const { data, error } = await sb.from("movies").select("genre");
  if (error) throw new Error(error.message);
  const set = new Set<string>();
  (data ?? []).forEach((r: any) => (r.genre ?? []).forEach((g: string) => set.add(g)));
  return Array.from(set).sort();
});

export const addMovie = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1).max(200),
        original_title: z.string().max(200).optional().nullable(),
        description: z.string().max(4000).optional().nullable(),
        year: z.number().int().min(1888).max(2100).optional().nullable(),
        genre: z.array(z.string().max(50)).max(10).default([]),
        type: z.string().max(30).optional().default("Film"),
        poster_url: z.string().url().optional().nullable(),
        backdrop_url: z.string().url().optional().nullable(),
        trailer_youtube_id: z.string().max(30).optional().nullable(),
        full_youtube_id: z.string().max(30).optional().nullable(),
        rating: z.number().min(0).max(10).optional().nullable(),
        duration_minutes: z.number().int().min(1).max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const sb = serverClient();
    const { data: row, error } = await (sb.from("movies") as any).insert(data).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listComments = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ movie_id: z.string() }).parse(input))
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
  .inputValidator((input: unknown) =>
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
