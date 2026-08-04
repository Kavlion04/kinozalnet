import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trash2 } from "lucide-react";
import { createGenre, deleteGenre, listGenreRows, type GenreDTO } from "@/lib/movies.functions";

export function AdminGenres() {
  const qc = useQueryClient();
  const create = useServerFn(createGenre);
  const remove = useServerFn(deleteGenre);
  const [name, setName] = useState("");

  const { data: rows = [] } = useQuery({
    queryKey: ["genre-rows"],
    queryFn: () => listGenreRows({}) as Promise<GenreDTO[]>,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["genre-rows"] });
    qc.invalidateQueries({ queryKey: ["genres"] });
  };

  const add = useMutation({
    mutationFn: () => create({ data: { name: name.trim() } }),
    onSuccess: () => {
      setName("");
      refresh();
    },
  });
  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: refresh,
  });

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add.mutate();
        }}
        className="mb-5 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yangi janr nomi"
          className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Qo'shish
        </button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Hali janr qo'shilmagan.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {rows.map((g) => (
            <li
              key={g.id}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-sm"
            >
              {g.name}
              <button
                type="button"
                onClick={() => del.mutate(g.id)}
                aria-label={`${g.name} o'chirish`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
