import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MovieRow } from "@/components/MovieRow";
import { listMovies, listGenres, listMoviesByIds, MOVIE_TYPES, type MovieDTO } from "@/lib/movies.functions";
import { useWatchProgress, useRecent } from "@/lib/watch-progress";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  genre: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
  year: fallback(z.number().int(), 0).default(0),
  sort: fallback(z.string(), "rating").default("rating"),
});

const moviesQO = (deps: { q: string; genre: string; type: string; year: number; sort: string }) =>
  queryOptions({
    queryKey: ["movies", deps],
    queryFn: () =>
      listMovies({
        data: {
          q: deps.q,
          genre: deps.genre,
          type: deps.type,
          year: deps.year || undefined,
          sort: deps.sort,
        },
      }) as Promise<MovieDTO[]>,
  });

const genresQO = queryOptions({
  queryKey: ["genres"],
  queryFn: () => listGenres() as Promise<string[]>,
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { q, genre, type, year, sort } }) => ({ q, genre, type, year, sort }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(moviesQO(deps)),
      context.queryClient.ensureQueryData(genresQO),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Kinozal — Kinolar, Anime, K-Drama va Multfilmlar" },
      { name: "description", content: "Kinolarni qidiring, tur va janr bo'yicha filtrlang, to'liq video tomosha qiling, izoh yozing va sevimlilarga saqlang." },
      { property: "og:title", content: "Kinozal — Kinolar, Anime, K-Drama va Multfilmlar" },
      { property: "og:description", content: "Kinolarni qidiring, tur va janr bo'yicha filtrlang, to'liq video tomosha qiling va sevimlilarga saqlang." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8">Topilmadi</div>,
});

function Home() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const { data: movies } = useSuspenseQuery(moviesQO(search));
  const { data: genres } = useSuspenseQuery(genresQO);

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
  const filtering = !!(search.q || search.genre || search.type || search.year);

  const heroPool = [...movies].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const byType = (t: string) => movies.filter((m) => m.type === t);

  const update = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }) });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <HeroCarousel movies={heroPool} />

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <TypeChip active={search.type === ""} onClick={() => update({ type: "" })}>
            Barchasi
          </TypeChip>
          {MOVIE_TYPES.map((t) => (
            <TypeChip key={t} active={search.type === t} onClick={() => update({ type: t })}>
              {t}
            </TypeChip>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Kino nomini qidiring..."
                defaultValue={search.q}
                onChange={(e) => update({ q: e.target.value })}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select
                value={search.genre}
                onChange={(e) => update({ genre: e.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
              >
                <option value="">Barcha janr</option>
                {genres.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <select
                value={search.year || ""}
                onChange={(e) => update({ year: e.target.value ? Number(e.target.value) : 0 })}
                className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
              >
                <option value="">Yil</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={search.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="rounded-lg border border-input bg-background px-3 py-2.5 outline-none focus:border-primary"
              >
                <option value="rating">Reyting</option>
                <option value="year">Yangi</option>
                <option value="title">A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {filtering ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-2xl">Natijalar</h2>
            <span className="text-sm text-muted-foreground">{movies.length} ta</span>
          </div>
          {movies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Bu filtr bo'yicha kino topilmadi.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
              {movies.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="pb-16">
          {MOVIE_TYPES.map((t) => (
            <MovieRow key={t} title={t} movies={byType(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}
