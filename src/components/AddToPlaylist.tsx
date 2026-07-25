import { useState } from "react";
import { ListPlus, Check, Plus } from "lucide-react";
import { usePlaylists } from "@/lib/playlists";

export function AddToPlaylist({ movieId }: { movieId: string }) {
  const { lists, create, toggleMovie } = usePlaylists();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleCreate = () => {
    const n = name.trim();
    if (!n) return;
    const id = create(n);
    toggleMovie(id, movieId);
    setName("");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-2.5 text-sm font-semibold hover:bg-accent"
      >
        <ListPlus className="h-4 w-4" /> To'plamga
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-2xl">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">To'plamlar</p>
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {lists.length === 0 && (
                <li className="rounded-md px-2 py-2 text-xs text-muted-foreground">Hali to'plam yo'q</li>
              )}
              {lists.map((p) => {
                const inList = p.movieIds.includes(movieId);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggleMovie(p.id, movieId)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <span className="truncate">{p.name}</span>
                      {inList ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{p.movieIds.length}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 flex gap-2 border-t border-border pt-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
                placeholder="Yangi to'plam nomi"
                className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleCreate}
                className="rounded-md bg-primary px-2.5 text-primary-foreground hover:opacity-90"
                aria-label="Yaratish"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
