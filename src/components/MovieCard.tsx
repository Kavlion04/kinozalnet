import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import type { MovieDTO } from "@/lib/movies.functions";

export function MovieCard({ movie }: { movie: MovieDTO }) {
  const { has, toggle } = useFavorites();
  const fav = has(movie.id);
  return (
    <div className="group relative">
      <Link
        to="/movie/$id"
        params={{ id: movie.id }}
        className="block overflow-hidden rounded-xl bg-card shadow-[var(--shadow-poster)] transition-transform duration-300 group-hover:-translate-y-1"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <SafeImage
            src={movie.poster_url}
            alt={movie.title}
            label={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {movie.rating != null && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-[var(--color-gold)] backdrop-blur">
              <Star className="h-3 w-3 fill-[var(--color-gold)]" />
              {movie.rating.toFixed(1)}
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{movie.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {movie.year ?? "—"} {movie.genre[0] ? `• ${movie.genre[0]}` : ""}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle(movie.id);
        }}
        aria-label="Sevimlilar"
        className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80"
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />
      </button>
    </div>
  );
}
