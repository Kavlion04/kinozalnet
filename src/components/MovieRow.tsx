import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { MovieDTO } from "@/lib/movies.functions";

export function MovieRow({ title, movies }: { title: string; movies: MovieDTO[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (movies.length === 0) return null;

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl">{title}</h2>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Chapga"
            className="rounded-full border border-border bg-card p-2 hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="O'ngga"
            className="rounded-full border border-border bg-card p-2 hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {movies.map((m) => (
          <div key={m.id} className="w-[45%] flex-none snap-start sm:w-[30%] md:w-[22%] lg:w-[17%]">
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
