import { useEffect, useState, useCallback } from "react";

export type Playlist = {
  id: string;
  name: string;
  movieIds: string[];
  createdAt: number;
};

const KEY = "kino_playlists_v1";
const EVT = "playlists-changed";

function read(): Playlist[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(list: Playlist[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVT));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function usePlaylists() {
  const [lists, setLists] = useState<Playlist[]>([]);
  useEffect(() => {
    setLists(read());
    const on = () => setLists(read());
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVT, on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const create = useCallback((name: string): string => {
    const id = uid();
    const next: Playlist = { id, name: name.trim() || "Yangi to'plam", movieIds: [], createdAt: Date.now() };
    write([next, ...read()]);
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((p) => p.id !== id));
  }, []);

  const rename = useCallback((id: string, name: string) => {
    write(read().map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const toggleMovie = useCallback((playlistId: string, movieId: string) => {
    write(
      read().map((p) => {
        if (p.id !== playlistId) return p;
        const has = p.movieIds.includes(movieId);
        return {
          ...p,
          movieIds: has ? p.movieIds.filter((x) => x !== movieId) : [movieId, ...p.movieIds],
        };
      }),
    );
  }, []);

  return { lists, create, remove, rename, toggleMovie };
}

export function usePlaylist(id: string | undefined) {
  const [pl, setPl] = useState<Playlist | null>(null);
  useEffect(() => {
    const load = () => setPl(read().find((p) => p.id === id) ?? null);
    load();
    window.addEventListener(EVT, load);
    return () => window.removeEventListener(EVT, load);
  }, [id]);
  return pl;
}

// Local comment moderation (hide comments per browser)
const HIDDEN_KEY = "kino_hidden_comments_v1";
const HIDDEN_EVT = "hidden-comments-changed";

function readHidden(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useHiddenComments() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(readHidden());
    const on = () => setIds(readHidden());
    window.addEventListener(HIDDEN_EVT, on);
    return () => window.removeEventListener(HIDDEN_EVT, on);
  }, []);
  const hide = (commentId: string) => {
    const next = Array.from(new Set([...readHidden(), commentId]));
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(HIDDEN_EVT));
  };
  return { hidden: ids, hide };
}
