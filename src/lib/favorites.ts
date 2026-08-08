import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listMyFavorites, toggleFavorite } from "./user-data.functions";

const KEY = "kino_favorites_v1";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("favorites-changed"));
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(read());
    const onChange = () => setIds(read());
    window.addEventListener("favorites-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("favorites-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  // Merge account favorites into the local list once signed in.
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session || cancelled) return;
      try {
        const rows = (await listMyFavorites({})) as { movie_id: string }[];
        const remote = rows.map((r) => r.movie_id);
        const local = read();
        const merged = Array.from(new Set([...local, ...remote]));
        const missing = local.filter((id) => !remote.includes(id));
        if (merged.length !== local.length) write(merged);
        for (const id of missing) {
          const res = await toggleFavorite({ data: { movie_id: id, on: true } }).catch(
            () => ({ ok: true, missing: true }) as { ok: true; missing?: true },
          );
          if (res?.missing) {
            // Movie no longer exists — drop it from the local list.
            write(read().filter((x) => x !== id));
          }
        }
      } catch {
        /* offline or not signed in */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = read();
    const on = !cur.includes(id);
    const next = on ? [...cur, id] : cur.filter((x) => x !== id);
    write(next);
    // Mirror the change into the account when signed in.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) toggleFavorite({ data: { movie_id: id, on } }).catch(() => {});
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
