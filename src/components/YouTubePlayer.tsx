import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<any> | null = null;
function loadYouTubeAPI(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

const storageKey = (videoId: string) => `yt-progress:${videoId}`;

type Props = {
  videoId: string;
  title: string;
  storageId?: string; // override the storage key (e.g. movie id)
};

export function YouTubePlayer({ videoId, title, storageId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const savedTimeRef = useRef<number>(0);
  const intervalRef = useRef<number | null>(null);
  const [savedTime, setSavedTime] = useState<number>(0);
  const [showResume, setShowResume] = useState(false);
  const key = storageKey(storageId ?? videoId);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      const t = raw ? parseFloat(raw) : 0;
      if (Number.isFinite(t) && t > 5) {
        savedTimeRef.current = t;
        setSavedTime(t);
        setShowResume(true);
      }
    } catch {}

    let destroyed = false;

    loadYouTubeAPI().then((YT) => {
      if (destroyed || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            intervalRef.current = window.setInterval(() => {
              try {
                const p = playerRef.current;
                if (!p || typeof p.getCurrentTime !== "function") return;
                const state = p.getPlayerState?.();
                // 1 = playing
                if (state === 1) {
                  const t = p.getCurrentTime();
                  if (Number.isFinite(t) && t > 0) {
                    localStorage.setItem(key, String(t));
                  }
                }
              } catch {}
            }, 3000);
          },
          onStateChange: (e: any) => {
            // 0 = ended
            if (e.data === 0) {
              try {
                localStorage.removeItem(key);
              } catch {}
              setShowResume(false);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      try {
        const p = playerRef.current;
        if (p && typeof p.getCurrentTime === "function") {
          const t = p.getCurrentTime();
          const state = p.getPlayerState?.();
          if (Number.isFinite(t) && t > 5 && state !== 0) {
            localStorage.setItem(key, String(t));
          }
        }
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, [videoId, key]);

  const resume = () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      p.seekTo(savedTimeRef.current, true);
      p.playVideo?.();
      setShowResume(false);
    } catch {}
  };

  const restart = () => {
    try {
      localStorage.removeItem(key);
    } catch {}
    const p = playerRef.current;
    try {
      p?.seekTo?.(0, true);
      p?.playVideo?.();
    } catch {}
    setShowResume(false);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-black shadow-[var(--shadow-poster)]">
        <div ref={containerRef} title={title} className="absolute inset-0 h-full w-full" />
      </div>
      {showResume && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Oxirgi tomosha qilingan joy: <span className="text-foreground font-medium">{fmt(savedTime)}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={resume}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Davom etish
            </button>
            <button
              onClick={restart}
              className="rounded-lg border border-border bg-background px-4 py-1.5 text-sm hover:bg-accent"
            >
              Boshidan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
