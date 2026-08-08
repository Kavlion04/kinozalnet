import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ListMusic, Plus, Trash2, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { usePlaylists } from "@/lib/playlists";

export const Route = createFileRoute("/playlists/")({
  head: () => ({
    meta: [
      { title: "To'plamlar — Kinozal" },
      {
        name: "description",
        content: "O'zingizning kino to'plamlaringizni yarating va boshqaring.",
      },
      { property: "og:title", content: "To'plamlar — Kinozal" },
      { property: "og:description", content: "Kino to'plamlari." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const { lists, create, remove } = usePlaylists();
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <ListMusic className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl">Mening to'plamlarim</h1>
            <p className="text-sm text-muted-foreground">{lists.length} ta to'plam</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            const id = create(n);
            setName("");
            navigate({ to: "/playlists/$id", params: { id } });
          }}
          className="mb-8 flex gap-2 rounded-2xl border border-border bg-card p-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Hafta oxiri uchun"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Yaratish
          </button>
        </form>

        {lists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Hali to'plam yo'q. Birinchi to'plamingizni yarating.
          </div>
        ) : (
          <ul className="space-y-2">
            {lists.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/40"
              >
                <Link to="/playlists/$id" params={{ id: p.id }} className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.movieIds.length} ta film</p>
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (confirm(`"${p.name}" o'chirilsinmi?`)) remove(p.id);
                    }}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    to="/playlists/$id"
                    params={{ id: p.id }}
                    className="rounded-md p-2 text-muted-foreground hover:bg-accent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
