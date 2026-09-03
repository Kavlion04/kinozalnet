import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { SearchAutosuggest } from "@/components/SearchAutosuggest";
import { EmptyState } from "@/components/EmptyState";
import { AppSelect } from "@/components/AppSelect";
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
  type SearchState = { q: string; type: string; genre: string; sort: string };
  const set = (patch: Partial<SearchState>) =>
    navigate({ search: (prev: SearchState) => ({ ...prev, ...patch }), replace: true });

  const { data: genres = [] } = useQuery({
    queryKey: ["genres"],
    queryFn: () => listGenres({}) as Promise<string[]>,
  });
  const { data: results = [], isFetching, refetch } = useQuery({
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

        <SearchAutosuggest
          autoFocus
          value={q}
          onChange={(v) => set({ q: v })}
          placeholder="Kino nomini yozing..."
          className="mb-4"
        />


        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => set({ type: "" })} className={chip(!type)}>
            Hammasi
          </button>
          {MOVIE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set({ type: t })}
              className={chip(type === t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <AppSelect
            value={genre}
            onChange={(v) => set({ genre: v })}
            allLabel="Barcha janrlar"
            ariaLabel="Janr"
            options={genres.map((g) => ({ value: g, label: g }))}
            className="w-full sm:w-48"
          />
          <AppSelect
            value={sort}
            onChange={(v) => set({ sort: v })}
            ariaLabel="Tartiblash"
            options={SORTS.map((s) => ({ value: s.v, label: s.l }))}
            className="w-full sm:w-48"
          />
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {isFetching ? "Qidirilmoqda..." : `${results.length} ta natija`}
        </p>

        {results.length === 0 && !isFetching ? (
          <EmptyState
            title={q ? `"${q}" bo'yicha natija yo'q` : "Natija topilmadi"}
            description="Imloni tekshirib ko'ring, qisqaroq so'z yozing yoki quyidagi janrlardan birini tanlang."
            onReset={() => set({ q: "", type: "", genre: "", sort: "rating" })}
            onRetry={() => refetch()}
            suggestions={genres.slice(0, 6)}
            onSuggestion={(g) => set({ q: "", genre: g })}
          />
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
