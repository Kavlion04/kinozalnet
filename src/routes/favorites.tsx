import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MovieCard } from "@/components/MovieCard";
import { listMovies, type MovieDTO } from "@/lib/movies.functions";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Sevimli kinolar — Kinozal" },
      { name: "description", content: "Sizning tanlangan sevimli filmlaringiz ro'yxati." },
      { property: "og:title", content: "Sevimli kinolar" },
      { property: "og:description", content: "Tanlangan filmlaringiz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids } = useFavorites();
  const { data: all = [] } = useQuery({
    queryKey: ["movies", { q: "", genre: "", sort: "rating" }],
    queryFn: () => listMovies({ data: {} }) as Promise<MovieDTO[]>,
  });
  const favs = all.filter((m) => ids.includes(m.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Heart className="h-5 w-5 fill-primary" />
          </div>
          <div>
            <h1 className="text-3xl">Sevimli kinolar</h1>
            <p className="text-sm text-muted-foreground">{favs.length} ta film saqlangan</p>
          </div>
        </div>

        {favs.length === 0 ? (
          <EmptyState
            title="Hali sevimli kinolar yo'q"
            description="Kino kartochkasidagi yurak belgisini bosing — kino shu bo'limda saqlanib qoladi."
            onRetry={() => refetch()}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {favs.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
