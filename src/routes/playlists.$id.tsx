import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2, Check, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { listMoviesByIds, type MovieDTO } from "@/lib/movies.functions";
import { usePlaylist, usePlaylists } from "@/lib/playlists";

export const Route = createFileRoute("/playlists/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `To'plam — Kinozal` },
      { name: "description", content: `Kino to'plami ${params.id}` },
      { property: "og:title", content: "Kino to'plami — Kinozal" },
      { property: "og:description", content: "Sizning tanlangan kino to'plamingiz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlaylistDetail,
});

function PlaylistDetail() {
  const { id } = Route.useParams();
  const pl = usePlaylist(id);
  const { rename, remove } = usePlaylists();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const { data: movies = [] } = useQuery({
    queryKey: ["playlist-movies", id, pl?.movieIds.join(",")],
    queryFn: () =>
      pl && pl.movieIds.length > 0
        ? (listMoviesByIds({ data: { ids: pl.movieIds } }) as Promise<MovieDTO[]>)
        : Promise.resolve([]),
    enabled: !!pl,
  });

  if (!pl) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <p className="text-muted-foreground">To'plam topilmadi.</p>
          <Link to="/playlists" className="mt-4 inline-block text-primary underline">
            To'plamlar ro'yxati
          </Link>
        </div>
      </div>
    );
  }

  // preserve user's order
  const ordered = pl.movieIds
    .map((mid) => movies.find((m) => m.id === mid))
    .filter((m): m is MovieDTO => !!m);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          to="/playlists"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> To'plamlar
        </Link>

        <div className="mt-4 mb-8 flex flex-wrap items-center justify-between gap-3">
          {editing ? (
            <div className="flex flex-1 items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    rename(pl.id, name.trim() || pl.name);
                    setEditing(false);
                  }
                }}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-2xl outline-none focus:border-primary"
              />
              <button
                onClick={() => {
                  rename(pl.id, name.trim() || pl.name);
                  setEditing(false);
                }}
                className="rounded-md bg-primary p-2 text-primary-foreground"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-border p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl">{pl.name}</h1>
              <p className="text-sm text-muted-foreground">{pl.movieIds.length} ta film</p>
            </div>
          )}
          {!editing && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setName(pl.name);
                  setEditing(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm hover:bg-accent"
              >
                <Pencil className="h-4 w-4" /> Nomi
              </button>
              <button
                onClick={() => {
                  if (confirm(`"${pl.name}" o'chirilsinmi?`)) {
                    remove(pl.id);
                    navigate({ to: "/playlists" });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" /> O'chirish
              </button>
            </div>
          )}
        </div>

        {ordered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            To'plam bo'sh. Kino sahifasidan "To'plamga" tugmasi orqali qo'shing.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {ordered.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
