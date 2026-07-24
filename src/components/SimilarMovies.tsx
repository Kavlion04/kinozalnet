import { useQuery } from "@tanstack/react-query";
import { listMovies, type MovieDTO } from "@/lib/movies.functions";
import { MovieCard } from "@/components/MovieCard";

export function SimilarMovies({ movie }: { movie: MovieDTO }) {
  const primaryGenre = movie.genre[0] ?? "";
  const { data } = useQuery({
    queryKey: ["similar", movie.id, primaryGenre, movie.type],
    queryFn: async () => {
      const byGenre = primaryGenre
        ? ((await listMovies({ data: { genre: primaryGenre, sort: "rating" } })) as MovieDTO[])
        : [];
      const byType = ((await listMovies({ data: { type: movie.type, sort: "rating" } })) as MovieDTO[]);
      const seen = new Set<string>([movie.id]);
      const out: MovieDTO[] = [];
      for (const m of [...byGenre, ...byType]) {
        if (seen.has(m.id)) continue;
        seen.add(m.id);
        out.push(m);
        if (out.length >= 12) break;
      }
      return out;
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="mb-4 text-2xl">Shunga o'xshash</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {data.slice(0, 12).map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
}
