import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SafeImage } from "@/components/SafeImage";
import {
  MOVIE_TYPES,
  addMovie,
  deleteMovie,
  listMovies,
  updateMovie,
  type MovieDTO,
} from "@/lib/movies.functions";

type FormState = {
  id?: string;
  title: string;
  original_title: string;
  description: string;
  year: string;
  genre: string;
  cast_list: string;
  type: string;
  poster_url: string;
  backdrop_url: string;
  trailer_youtube_id: string;
  full_youtube_id: string;
  video_url: string;
  subtitles_url: string;
  trailer_url: string;
  rating: string;
  duration_minutes: string;
};

const empty: FormState = {
  title: "",
  original_title: "",
  description: "",
  year: "",
  genre: "",
  cast_list: "",
  type: "Film",
  poster_url: "",
  backdrop_url: "",
  trailer_youtube_id: "",
  full_youtube_id: "",
  video_url: "",
  subtitles_url: "",
  trailer_url: "",
  rating: "",
  duration_minutes: "",
};

const fromMovie = (m: MovieDTO): FormState => ({
  id: m.id,
  title: m.title,
  original_title: m.original_title ?? "",
  description: m.description ?? "",
  year: m.year ? String(m.year) : "",
  genre: m.genre.join(", "),
  cast_list: m.cast_list.join(", "),
  type: m.type,
  poster_url: m.poster_url ?? "",
  backdrop_url: m.backdrop_url ?? "",
  trailer_youtube_id: m.trailer_youtube_id ?? "",
  full_youtube_id: m.full_youtube_id ?? "",
  video_url: m.video_url ?? "",
  subtitles_url: m.subtitles_url ?? "",
  trailer_url: m.trailer_url ?? "",
  rating: m.rating != null ? String(m.rating) : "",
  duration_minutes: m.duration_minutes ? String(m.duration_minutes) : "",
});

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function UploadZone({
  label,
  accept,
  placeholder,
  field: fieldProps,
  value,
  busy,
  onFile,
}: {
  kind: "video" | "subtitles";
  label: string;
  accept: string;
  placeholder: string;
  field: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    className: string;
  };
  value: string;
  busy: boolean;
  onFile: (f: File) => void;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs text-muted-foreground">{label}</label>
      <input placeholder={placeholder} {...fieldProps} />
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-5 text-center text-xs transition ${
          drag
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/60 hover:bg-accent/50"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
      >
        <Upload className={`h-5 w-5 ${drag ? "text-primary" : "text-muted-foreground"}`} />
        <span className="font-medium">
          {busy ? "Yuklanmoqda..." : "Faylni shu yerga tashlang yoki bosing"}
        </span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        {value.trim() && (
          <span className="max-w-full truncate text-[11px] text-muted-foreground">
            ✓ {value.trim()}
          </span>
        )}
      </label>
    </div>
  );
}

export function AdminMovies() {
  const qc = useQueryClient();
  const create = useServerFn(addMovie);
  const update = useServerFn(updateMovie);
  const remove = useServerFn(deleteMovie);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const { data: movies = [] } = useQuery({
    queryKey: ["movies", { admin: true }],
    queryFn: () => listMovies({ data: { sort: "newest" } }) as Promise<MovieDTO[]>,
  });

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        title: f.title.trim(),
        original_title: f.original_title.trim() || null,
        description: f.description.trim() || null,
        year: f.year ? Number(f.year) : null,
        genre: list(f.genre),
        cast_list: list(f.cast_list),
        type: f.type,
        poster_url: f.poster_url.trim() || null,
        backdrop_url: f.backdrop_url.trim() || null,
        trailer_youtube_id: f.trailer_youtube_id.trim() || null,
        full_youtube_id: f.full_youtube_id.trim() || null,
        video_url: f.video_url.trim() || null,
        subtitles_url: f.subtitles_url.trim() || null,
        trailer_url: f.trailer_url.trim() || null,
        rating: f.rating ? Number(f.rating) : null,
        duration_minutes: f.duration_minutes ? Number(f.duration_minutes) : null,
      };
      return f.id ? update({ data: { id: f.id, ...payload } }) : create({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movies"] });
      setForm(null);
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["movies"] }),
  });

  const upload = async (file: File, kind: "video" | "subtitles") => {
    setBusy(kind);
    setError(null);
    const safe = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${kind}/${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    setBusy(null);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setForm((f) => (f ? { ...f, [kind === "video" ? "video_url" : "subtitles_url"]: path } : f));
  };

  const field = (k: keyof FormState) => ({
    value: (form?.[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => (f ? { ...f, [k]: e.target.value } : f)),
    className:
      "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary",
  });

  const term = q.trim().toLowerCase();
  const shown = term
    ? movies.filter((m) =>
        [m.title, m.original_title ?? "", m.type, String(m.year ?? "")].some((v) =>
          v.toLowerCase().includes(term),
        ),
      )
    : movies;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kino qidirish..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <p className="text-sm text-muted-foreground">{shown.length} / {movies.length} ta kino</p>
        <button
          type="button"
          onClick={() => setForm({ ...empty })}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Yangi kino
        </button>
      </div>

      {form && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(form);
          }}
          className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg">{form.id ? "Kinoni tahrirlash" : "Yangi kino"}</h3>
            <button type="button" onClick={() => setForm(null)} aria-label="Yopish" className="p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Nomi *" {...field("title")} />
            <input placeholder="Asl nomi" {...field("original_title")} />
            <input type="number" placeholder="Yil" {...field("year")} />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {MOVIE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input placeholder="Janrlar (vergul bilan)" {...field("genre")} />
            <input placeholder="Aktyorlar (vergul bilan)" {...field("cast_list")} />
            <input placeholder="Poster URL" {...field("poster_url")} />
            <input placeholder="Backdrop URL" {...field("backdrop_url")} />
            <input placeholder="YouTube treyler ID" {...field("trailer_youtube_id")} />
            <input placeholder="YouTube to'liq ID" {...field("full_youtube_id")} />
            <input type="number" step="0.1" placeholder="Reyting 0-10" {...field("rating")} />
            <input type="number" placeholder="Davomiyligi (daq)" {...field("duration_minutes")} />
          </div>

          <textarea rows={3} placeholder="Tavsif" {...field("description")} />

          <div className="grid gap-3 sm:grid-cols-2">
            <UploadZone
              kind="video"
              label="Video (fayl yuklash yoki havola)"
              accept="video/*"
              placeholder="video/... yoki https://..."
              field={field("video_url")}
              value={form.video_url}
              busy={busy === "video"}
              onFile={(f) => void upload(f, "video")}
            />
            <UploadZone
              kind="subtitles"
              label="Subtitr (.vtt) yoki havola"
              accept=".vtt,text/vtt"
              placeholder="subtitles/... yoki https://..."
              field={field("subtitles_url")}
              value={form.subtitles_url}
              busy={busy === "subtitles"}
              onFile={(f) => void upload(f, "subtitles")}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {shown.map((m) => (
          <li
            key={m.id}
            className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md">
              <SafeImage
                src={m.poster_url}
                alt={m.title}
                className="h-full w-full object-cover"
                showIcon={false}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{m.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {m.type} • {m.year ?? "—"} • {m.video_url ? "video ✓" : "video ✗"} •{" "}
                {m.subtitles_url ? "subtitr ✓" : "subtitr ✗"}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => setForm(fromMovie(m))}
                aria-label="Tahrirlash"
                className="rounded-lg border border-border p-2 hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${m.title}" o'chirilsinmi?`)) del.mutate(m.id);
                }}
                aria-label="O'chirish"
                className="rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
