import { useEffect, useState } from "react";
import { ListPlus, Check, Plus, X } from "lucide-react";
import { usePlaylists } from "@/lib/playlists";

export function AddToPlaylist({ movieId }: { movieId: string }) {
  const { lists, create, toggleMovie } = usePlaylists();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  // Telegram bot "To'plamga qo'sh" tugmasi: /movie/<id>?add=1 bilan kelganda darhol ochiladi.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("add") === "1") setOpen(true);
  }, []);


  const handleCreate = () => {
    const n = name.trim();
    if (!n) return;
    const id = create(n);
    toggleMovie(id, movieId);
    setName("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
      >
        <ListPlus className="h-4 w-4" /> To'plamga
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">To'plamga qo'shish</h3>
                <p className="text-xs text-muted-foreground">
                  {lists.length} ta to'plam mavjud
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {lists.length === 0 && (
                <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  Hali to'plam yo'q — pastda yangi to'plam yarating
                </li>
              )}
              {lists.map((p) => {
                const inList = p.movieIds.includes(movieId);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggleMovie(p.id, movieId)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-sm transition-colors ${
                        inList
                          ? "border-primary/50 bg-primary/10"
                          : "border-border bg-secondary/40 hover:bg-accent"
                      }`}
                    >
                      <span className="truncate font-medium">{p.name}</span>
                      {inList ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          <Check className="h-4 w-4" /> Qo'shilgan
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {p.movieIds.length} ta film
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex gap-2 border-t border-border pt-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
                placeholder="Yangi to'plam nomi"
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
