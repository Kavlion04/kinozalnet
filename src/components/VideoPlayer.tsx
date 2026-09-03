import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Subtitles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media.functions";
import { saveProgress } from "@/lib/user-data.functions";
import { useAuth } from "@/hooks/useAuth";
import { PlayerExtras } from "@/components/PlayerExtras";

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/** Premium HTML5 player: resume, subtitles, speed, keyboard shortcuts, progress sync. */
export function VideoPlayer({
  movieId,
  src,
  subtitles,
  poster,
  title,
}: {
  movieId: string;
  src: string;
  subtitles?: string | null;
  poster?: string | null;
  title: string;
}) {
  const key = `video-progress:${movieId}`;
  const { user } = useAuth();
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [subsOn, setSubsOn] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  const { data: video } = useQuery({
    queryKey: ["media", src],
    queryFn: () => getMediaUrl({ data: { path: src } }),
    staleTime: 1000 * 60 * 60,
  });
  const { data: subs } = useQuery({
    queryKey: ["media", subtitles],
    queryFn: () => getMediaUrl({ data: { path: subtitles! } }),
    enabled: !!subtitles,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    const saved = parseFloat(localStorage.getItem(key) || "0");
    if (Number.isFinite(saved) && saved > 15) setResumeAt(saved);
  }, [key]);

  const persist = useCallback(
    (pos: number, dur: number) => {
      localStorage.setItem(key, String(Math.floor(pos)));
      if (user) {
        saveProgress({
          data: { movie_id: movieId, position_seconds: pos, duration_seconds: dur || null },
        }).catch(() => {});
      }
    },
    [key, movieId, user],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = window.setInterval(() => {
      if (!el.paused && el.currentTime > 5) persist(el.currentTime, el.duration);
    }, 5000);
    const onLeave = () => persist(el.currentTime, el.duration);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("beforeunload", onLeave);
      onLeave();
    };
  }, [persist, video?.url]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };
  const seek = (delta: number) => {
    const el = ref.current;
    if (el) el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") seek(10);
      else if (e.code === "ArrowLeft") seek(-10);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (video && !video.url) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Video hozircha mavjud emas.
      </div>
    );
  }

  const jumpTo = (secs: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.duration ? Math.min(el.duration, secs) : secs);
    void el.play();
  };
  const goFullscreen = () => {
    const el = wrapRef.current ?? ref.current;
    void (el as any)?.requestFullscreen?.() ?? (ref.current as any)?.webkitEnterFullscreen?.();
  };

  return (
    <div>
    <div ref={wrapRef} className="group relative overflow-hidden rounded-2xl border border-border bg-black shadow-[var(--shadow-poster)]">
      <video
        ref={ref}
        src={video?.url ?? undefined}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black"
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        crossOrigin="anonymous"
      >
        {subs?.url && (
          <track kind="subtitles" srcLang="uz" label="O'zbekcha" src={subs.url} default={subsOn} />
        )}
      </video>

      {resumeAt !== null && (
        <button
          type="button"
          onClick={() => {
            const el = ref.current;
            if (el) {
              el.currentTime = resumeAt;
              void el.play();
            }
            setResumeAt(null);
          }}
          className="absolute left-4 top-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          {fmt(resumeAt)} dan davom etish
        </button>
      )}

      <div className="space-y-2 bg-gradient-to-t from-black to-black/60 px-3 py-3 sm:px-4">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={time}
          aria-label="Vaqt"
          onChange={(e) => {
            const el = ref.current;
            if (el) el.currentTime = Number(e.target.value);
          }}
          className="h-1.5 w-full cursor-pointer accent-[var(--color-primary)]"
        />
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-white">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              aria-label="O'ynatish"
              className="rounded p-2 hover:bg-white/10"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => seek(-10)}
              aria-label="10s orqaga"
              className="rounded p-2 hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => seek(10)}
              aria-label="10s oldinga"
              className="rounded p-2 hover:bg-white/10"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
          <span className="min-w-0 truncate text-xs tabular-nums text-white/70">
            {fmt(time)} / {fmt(duration)} — {title}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const el = ref.current;
                if (el) {
                  el.muted = !el.muted;
                  setMuted(el.muted);
                }
              }}
              aria-label="Ovoz"
              className="rounded p-2 hover:bg-white/10"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              aria-label="Ovoz balandligi"
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                const el = ref.current;
                if (el) {
                  el.volume = v;
                  el.muted = v === 0;
                  setMuted(v === 0);
                }
              }}
              className="hidden h-1 w-16 cursor-pointer accent-[var(--color-primary)] sm:block"
            />
            {subtitles && (
              <button
                type="button"
                onClick={() => {
                  const el = ref.current;
                  const track = el?.textTracks?.[0];
                  if (track) {
                    const on = track.mode !== "showing";
                    track.mode = on ? "showing" : "hidden";
                    setSubsOn(on);
                  }
                }}
                aria-label="Subtitrlar"
                className={`rounded p-2 hover:bg-white/10 ${subsOn ? "text-primary" : ""}`}
              >
                <Subtitles className="h-4 w-4" />
              </button>
            )}
            <select
              value={speed}
              aria-label="Tezlik"
              onChange={(e) => {
                const v = Number(e.target.value);
                setSpeed(v);
                if (ref.current) ref.current.playbackRate = v;
              }}
              className="rounded bg-white/10 px-1.5 py-1 text-xs"
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s} className="text-black">
                  {s}x
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={goFullscreen}
              aria-label="To'liq ekran"
              className="rounded p-2 hover:bg-white/10"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
      <PlayerExtras onSeek={jumpTo} onFullscreen={goFullscreen} />
    </div>
  );
}
