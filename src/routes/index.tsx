import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { MovieRow } from "@/components/MovieRow";
import { SearchAutosuggest } from "@/components/SearchAutosuggest";
import { AppSelect } from "@/components/AppSelect";
import { EmptyState } from "@/components/EmptyState";
import { useFavorites } from "@/lib/favorites";
import {
  listMovies,
  listGenres,
  listMoviesByIds,
  MOVIE_TYPES,
  type MovieDTO,
} from "@/lib/movies.functions";
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
      {
        name: "description",
        content:
          "Kinolarni qidiring, tur va janr bo'yicha filtrlang, to'liq video tomosha qiling, izoh yozing va sevimlilarga saqlang.",
      },
      { property: "og:title", content: "Kinozal — Kinolar, Anime, K-Drama va Multfilmlar" },
      {
        property: "og:description",
        content:
          "Kinolarni qidiring, tur va janr bo'yicha filtrlang, to'liq video tomosha qiling va sevimlilarga saqlang.",
      },
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
  const { data: movies, refetch } = useSuspenseQuery(moviesQO(search));
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


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchAutosuggest
              value={search.q}
              onChange={(v) => update({ q: v })}
              className="flex-1"
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <AppSelect
                value={search.genre}
                onChange={(v) => update({ genre: v })}
                allLabel="Barcha janr"
                ariaLabel="Janr"
                options={genres.map((g) => ({ value: g, label: g }))}
                className="w-36"
              />
              <AppSelect
                value={search.year ? String(search.year) : ""}
                onChange={(v) => update({ year: v ? Number(v) : 0 })}
                allLabel="Yil"
                ariaLabel="Yil"
                options={years.map((y) => ({ value: String(y), label: String(y) }))}
                className="w-28"
              />
              <AppSelect
                value={search.sort}
                onChange={(v) => update({ sort: v })}
                ariaLabel="Saralash"
                options={[
                  { value: "rating", label: "Reyting" },
                  { value: "year", label: "Yangi" },
                  { value: "title", label: "A-Z" },
                ]}
                className="w-32"
              />
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
            <EmptyState
              title="Bu filtr bo'yicha kino topilmadi"
              description="Nomni qisqartirib yozing yoki janr/yil filtrlarini tozalab ko'ring."
              onReset={() => update({ q: "", genre: "", type: "", year: 0 })}
              onRetry={() => refetch()}
              suggestions={genres.slice(0, 6)}
              onSuggestion={(g) => update({ q: "", genre: g, year: 0 })}
            />
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
          <PersonalRows />
          {MOVIE_TYPES.map((t) => (
            <MovieRow key={t} title={t} movies={byType(t)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonalRows() {
  const progress = useWatchProgress();
  const recent = useRecent();
  const { ids: favIds } = useFavorites();

  const progressIds = progress.map((p) => p.movieId);
  const idSet = new Set(progressIds);
  const recentOnly = recent.filter((id) => !idSet.has(id));

  const allIds = Array.from(new Set([...favIds, ...progressIds, ...recentOnly])).slice(0, 40);

  const { data } = useQuery({
    queryKey: ["by-ids", allIds],
    queryFn: () => listMoviesByIds({ data: { ids: allIds } }) as Promise<MovieDTO[]>,
    enabled: allIds.length > 0,
  });

  if (!data || data.length === 0) return null;
  const map = new Map(data.map((m) => [m.id, m]));

  const pick = (list: string[]) => list.map((id) => map.get(id)).filter(Boolean) as MovieDTO[];
  const favMovies = pick(favIds);
  const continueMovies = pick(progressIds);
  const recentMovies = pick(recentOnly);

  return (
    <>
      {favMovies.length > 0 && (
        <MovieRow title="Sevimlilar" movies={favMovies} viewAllTo="/favorites" />
      )}
      {continueMovies.length > 0 && <MovieRow title="Davom eting" movies={continueMovies} />}
      {recentMovies.length > 0 && <MovieRow title="Yaqinda ko'rilgan" movies={recentMovies} />}
    </>
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
