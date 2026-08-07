import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { MOVIE_TYPES, listGenres, listMovies, type MovieDTO } from "@/lib/movies.functions";

const searchSchema = z.object({
  q: z.string().optional().default(""),
  type: z.string().optional().default(""),
  genre: z.string().optional().default(""),
  sort: z.string().optional().default("rating"),
});

export const Route = createFileRoute("/search")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Kino qidirish — Kinozal" },
      {
        name: "description",
        content: "Nomi, janri va turi bo'yicha film, serial, anime va multfilmlarni qidiring.",
      },
      { property: "og:title", content: "Kino qidirish — Kinozal" },
      { property: "og:description", content: "Janr, tur va nom bo'yicha kinolarni toping." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

const SORTS = [
  { v: "rating", l: "Reyting" },
  { v: "newest", l: "Yangi qo'shilgan" },
  { v: "year", l: "Yil" },
  { v: "title", l: "Nomi (A-Z)" },
];

function SearchPage() {
  const { q, type, genre, sort } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const set = (patch: Partial<{ q: string; type: string; genre: string; sort: string }>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: () => listGenres({}) as Promise<string[]>,
  });
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["movies", { q, type, genre, sort }],
    queryFn: () => listMovies({ data: { q, type, genre, sort } }) as Promise<MovieDTO[]>,
  });

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="mb-5 text-3xl">Qidirish</h1>

        <div className="relative mb-4">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Kino nomini yozing..."
            aria-label="Kino qidirish"
            className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => set({ type: "" })} className={chip(!type)}>
            Hammasi
          </button>
          {MOVIE_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => set({ type: t })} className={chip(type === t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <select
            value={genre}
            onChange={(e) => set({ genre: e.target.value })}
            aria-label="Janr"
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="">Barcha janrlar</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => set({ sort: e.target.value })}
            aria-label="Tartiblash"
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {isFetching ? "Qidirilmoqda..." : `${results.length} ta natija`}
        </p>

        {results.length === 0 && !isFetching ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Hech narsa topilmadi. Boshqa so'z bilan urinib ko'ring.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {results.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
