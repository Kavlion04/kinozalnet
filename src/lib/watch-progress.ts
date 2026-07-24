import { useEffect, useState } from "react";

export type WatchEntry = {
  movieId: string;
  kind: "full" | "trailer";
  time: number;
};

function scan(): WatchEntry[] {
  if (typeof window === "undefined") return [];
  const out: WatchEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const m = k.match(/^yt-progress:movie:([^:]+):(full|trailer)$/);
    if (!m) continue;
    const t = parseFloat(localStorage.getItem(k) || "0");
    if (Number.isFinite(t) && t > 10) {
      out.push({ movieId: m[1], kind: m[2] as "full" | "trailer", time: t });
    }
  }
  return out;
}

export function useWatchProgress() {
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  useEffect(() => {
    setEntries(scan());
    const on = () => setEntries(scan());
    window.addEventListener("storage", on);
    window.addEventListener("watch-progress-changed", on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("watch-progress-changed", on);
    };
  }, []);
  return entries;
}

const RECENT_KEY = "kino_recent_v1";

export function pushRecent(movieId: string) {
  if (typeof window === "undefined") return;
  try {
    const cur: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const next = [movieId, ...cur.filter((x) => x !== movieId)].slice(0, 20);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("recent-changed"));
  } catch {}
}

export function useRecent() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        setIds(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
      } catch {
        setIds([]);
      }
    };
    read();
    window.addEventListener("recent-changed", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("recent-changed", read);
      window.removeEventListener("storage", read);
    };
  }, []);
  return ids;
}

const RATING_KEY = "kino_user_ratings_v1";

function readRatings(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(RATING_KEY) || "{}");
  } catch {
    return {};
  }
}

export function useUserRating(movieId: string) {
  const [value, setValue] = useState<number>(0);
  useEffect(() => {
    setValue(readRatings()[movieId] ?? 0);
    const on = () => setValue(readRatings()[movieId] ?? 0);
    window.addEventListener("user-rating-changed", on);
    return () => window.removeEventListener("user-rating-changed", on);
  }, [movieId]);
  const set = (n: number) => {
    const all = readRatings();
    if (n <= 0) delete all[movieId];
    else all[movieId] = n;
    localStorage.setItem(RATING_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event("user-rating-changed"));
  };
  return { value, set };
}
