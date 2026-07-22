import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { listMovies, listGenres, type MovieDTO } from "@/lib/movies.functions";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  genre: fallback(z.string(), "").default(""),
  year: fallback(z.number().int(), 0).default(0),
  sort: fallback(z.string(), "rating").default("rating"),
});

const moviesQO = (deps: { q: string; genre: string; year: number; sort: string }) =>
  queryOptions({
    queryKey: ["movies", deps],
    queryFn: () =>
      listMovies({
        data: { q: deps.q, genre: deps.genre, year: deps.year || undefined, sort: deps.sort },
      }) as Promise<MovieDTO[]>,
  });

const genresQO = queryOptions({
  queryKey: ["genres"],
  queryFn: () => listGenres() as Promise<string[]>,
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { q, genre, year, sort } }) => ({ q, genre, year, sort }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(moviesQO(deps)),
      context.queryClient.ensureQueryData(genresQO),
    ]);
  },
  head: () => ({
    meta: [
      { title: "Kinozal — Kinolar katalogi, treyler va sevimlilar" },
      { name: "description", content: "Kinolarni qidiring, janrlar bo'yicha filtrlang, treylerlarni ko'ring va sevimli filmlar ro'yxatini yarating." },
      { property: "og:title", content: "Kinozal — Kinolar katalogi" },
      { property: "og:description", content: "Filmlar, treylerlar va sevimlilar bir joyda." },
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

  const featured = movies[0];
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  const update = (patch: Partial<z.infer<typeof searchSchema>>) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, ...patch }) });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {featured && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            {featured.backdrop_url && (
              <img src={featured.backdrop_url} alt="" className="h-full w-full object-cover opacity-40" />
            )}
            <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Bugungi tavsiya</p>
            <h1 className="mt-3 max-w-2xl text-5xl leading-none sm:text-7xl">{featured.title}</h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base line-clamp-3">
              {featured.description}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={`/movie/${featured.id}`}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
              >
                ▶ Treylerni ko'rish
              </a>
              <span className="text-sm text-muted-foreground">
                {featured.year} • {featured.duration_minutes} daq
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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
            <div className="flex items-center gap-2 text-sm">
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

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl">Barcha kinolar</h2>
          <span className="text-sm text-muted-foreground">{movies.length} ta film</span>
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
    </div>
  );
}
