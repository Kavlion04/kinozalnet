import { useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Clock, Heart, Share2, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Comments } from "@/components/Comments";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { StarRating } from "@/components/StarRating";
import { SimilarMovies } from "@/components/SimilarMovies";
import { AddToPlaylist } from "@/components/AddToPlaylist";
import { getMovie, type MovieDTO } from "@/lib/movies.functions";
import { useFavorites } from "@/lib/favorites";
import { pushRecent } from "@/lib/watch-progress";

const movieQO = (id: string) =>
  queryOptions({
    queryKey: ["movie", id],
    queryFn: () => getMovie({ data: { id } }) as Promise<MovieDTO | null>,
  });

export const Route = createFileRoute("/movie/$id")({
  loader: async ({ context, params }) => {
    const movie = await context.queryClient.ensureQueryData(movieQO(params.id));
    if (!movie) throw notFound();
    return { movie };
  },
  head: ({ loaderData }) => {
    const m = loaderData?.movie;
    if (!m) return { meta: [{ title: "Kino topilmadi" }] };
    return {
      meta: [
        { title: `${m.title} — Kinozal` },
        { name: "description", content: m.description?.slice(0, 155) ?? m.title },
        { property: "og:title", content: m.title },
        { property: "og:description", content: m.description?.slice(0, 155) ?? "" },
        { property: "og:type", content: "video.movie" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(m.backdrop_url
          ? [
              { property: "og:image", content: m.backdrop_url },
              { name: "twitter:image", content: m.backdrop_url },
            ]
          : []),
      ],
    };
  },
  component: MoviePage,
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-8">
      Kino topilmadi. <Link to="/" className="text-primary underline">Bosh sahifa</Link>
    </div>
  ),
});

function MoviePage() {
  const { id } = Route.useParams();
  const { data: movie } = useSuspenseQuery(movieQO(id));
  const { has, toggle } = useFavorites();
  useEffect(() => {
    if (movie) pushRecent(movie.id);
  }, [movie?.id]);
  if (!movie) return null;
  const fav = has(movie.id);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: movie.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative">
        {movie.backdrop_url && (
          <div className="absolute inset-x-0 top-0 h-[60vh] overflow-hidden">
            <SafeImage
              src={movie.backdrop_url}
              alt=""
              showIcon={false}
              loading="eager"
              className="h-full w-full object-cover opacity-30"
            />
            <div className="absolute inset-0" style={{ background: "var(--gradient-fade)" }} />
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Orqaga
          </Link>

          <div className="mt-6 grid gap-8 md:grid-cols-[280px_1fr]">
            <div className="mx-auto w-full max-w-[280px]">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-[var(--shadow-poster)]">
                <SafeImage
                  src={movie.poster_url}
                  alt={movie.title}
                  label={movie.title}
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>


            <div>
              <h1 className="text-4xl sm:text-6xl">{movie.title}</h1>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="mt-1 text-sm text-muted-foreground">{movie.original_title}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {movie.rating != null && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-gold)]">
                    <Star className="h-4 w-4 fill-[var(--color-gold)]" /> {movie.rating.toFixed(1)}
                  </span>
                )}
                {movie.year && <span className="text-muted-foreground">{movie.year}</span>}
                {movie.duration_minutes && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" /> {movie.duration_minutes} daq
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {movie.genre.map((g) => (
                  <span key={g} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">
                    {g}
                  </span>
                ))}
              </div>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {movie.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => toggle(movie.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                    fav
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-secondary text-foreground hover:bg-accent"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${fav ? "fill-primary-foreground" : ""}`} />
                  {fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
                </button>
                <button
                  onClick={share}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-2.5 text-sm font-semibold hover:bg-accent"
                >
                  <Share2 className="h-4 w-4" /> Ulashish
                </button>
                <AddToPlaylist movieId={movie.id} />
              </div>

              <StarRating movieId={movie.id} />
            </div>
          </div>

          {movie.full_youtube_id && (
            <div className="mt-12">
              <h2 className="mb-4 text-2xl">To'liq kino</h2>
              <YouTubePlayer
                videoId={movie.full_youtube_id}
                title={`${movie.title} — to'liq kino`}
                storageId={`movie:${movie.id}:full`}
              />
            </div>
          )}

          {movie.trailer_youtube_id && movie.trailer_youtube_id !== movie.full_youtube_id && (
            <div className="mt-12">
              <h2 className="mb-4 text-2xl">Treyler</h2>
              <YouTubePlayer
                videoId={movie.trailer_youtube_id}
                title={`${movie.title} treyler`}
                storageId={`movie:${movie.id}:trailer`}
              />
            </div>
          )}

          <SimilarMovies movie={movie} />

          <Comments movieId={movie.id} />

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}
