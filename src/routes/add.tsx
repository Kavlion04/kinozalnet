import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

import { addMovie, MOVIE_TYPES } from "@/lib/movies.functions";
import { SafeImage } from "@/components/SafeImage";

/** Returns a clean URL, null when empty, or false when the value is not a usable image link. */
function normalizeImageUrl(raw: string): string | null | false {
  const v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return false;
  // Reject page links (search results, IMDb pages, share links) — they are not images.
  if (
    /^https?:\/\/(www\.)?(google\.[a-z.]+|share\.google|imdb\.com|youtube\.com|pinterest\.)/i.test(
      v,
    )
  )
    return false;
  return v;
}

/** Accepts a bare ID or any YouTube URL and returns the 11-char video ID. */
function normalizeYouTubeId(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  const m = v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : v;
}

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Kino qo'shish — Kinozal" },
      { name: "description", content: "O'zingizning kinoyingizni katalogga qo'shing." },
      { property: "og:title", content: "Kino qo'shish" },
      { property: "og:description", content: "Kinozal katalogiga yangi film qo'shing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AddPage,
});

function AddPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const qc = useQueryClient();
  const add = useServerFn(addMovie);
  const [form, setForm] = useState({
    title: "",
    original_title: "",
    description: "",
    year: "",
    genre: "",
    type: "Film",
    poster_url: "",
    backdrop_url: "",
    trailer_youtube_id: "",
    full_youtube_id: "",
    rating: "",
    duration_minutes: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const poster = normalizeImageUrl(form.poster_url);
      const backdrop = normalizeImageUrl(form.backdrop_url);
      if (poster === false)
        throw new Error("Poster URL to'g'ri rasm havolasi bo'lishi kerak (https://... .jpg/.png)");
      if (backdrop === false)
        throw new Error(
          "Backdrop URL to'g'ri rasm havolasi bo'lishi kerak (https://... .jpg/.png)",
        );

      const payload = {
        title: form.title.trim(),
        original_title: form.original_title.trim() || null,
        description: form.description.trim() || null,
        year: form.year ? Number(form.year) : null,
        genre: form.genre
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        type: form.type,
        poster_url: poster,
        backdrop_url: backdrop,
        trailer_youtube_id: normalizeYouTubeId(form.trailer_youtube_id),
        full_youtube_id: normalizeYouTubeId(form.full_youtube_id),
        rating: form.rating ? Number(form.rating) : null,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      };
      return add({ data: payload });
    },

    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["movies"] });
      qc.invalidateQueries({ queryKey: ["genres"] });
      navigate({ to: "/movie/$id", params: { id: res.id } });
    },
    onError: (e: Error) => setError(e.message),
  });

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value }),
    className:
      "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary",
  });

  if (!authLoading && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-3xl">Faqat adminlar uchun</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Kino qo'shish huquqi faqat administratorlarda mavjud.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl">Yangi kino qo'shish</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ma'lumot bazaga saqlanadi va katalogda ko'rinadi.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            mutation.mutate();
          }}
          className="mt-8 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nomi *</label>
            <input required {...field("title")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Asl nomi
              </label>
              <input {...field("original_title")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Yil</label>
              <input type="number" {...field("year")} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tavsif</label>
            <textarea rows={4} {...field("description")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Janrlar (vergul bilan)
              </label>
              <input placeholder="Drama, Triller, Ekshn" {...field("genre")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Turi</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {MOVIE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Poster URL
              </label>
              <input placeholder="https://.../poster.jpg" {...field("poster_url")} />
              {form.poster_url.trim() && (
                <div className="mt-2 h-28 w-20 overflow-hidden rounded-lg border border-border">
                  <SafeImage
                    src={form.poster_url}
                    alt="Poster ko'rinishi"
                    label="Havola ishlamadi"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Backdrop URL
              </label>
              <input placeholder="https://.../backdrop.jpg" {...field("backdrop_url")} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                YouTube ID (treyler)
              </label>
              <input placeholder="dQw4w9WgXcQ" {...field("trailer_youtube_id")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                YouTube ID (to'liq video)
              </label>
              <input placeholder="dQw4w9WgXcQ" {...field("full_youtube_id")} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Reyting 0-10
              </label>
              <input type="number" step="0.1" min="0" max="10" {...field("rating")} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Davomiyligi (daq)
              </label>
              <input type="number" {...field("duration_minutes")} />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? "Saqlanmoqda..." : "Bazaga qo'shish"}
          </button>
        </form>
      </div>
    </div>
  );
}
