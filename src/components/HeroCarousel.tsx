import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MovieDTO } from "@/lib/movies.functions";

export function HeroCarousel({ movies }: { movies: MovieDTO[] }) {
  const slides = movies.slice(0, 5);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const m = slides[i];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {m.backdrop_url && (
          <img
            key={m.id}
            src={m.backdrop_url}
            alt=""
            className="h-full w-full object-cover opacity-40 transition-opacity duration-700"
          />
        )}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Bugungi tavsiya</p>
        <h1 className="mt-3 max-w-2xl text-5xl leading-none sm:text-7xl">{m.title}</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base line-clamp-3">
          {m.description}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/movie/$id"
            params={{ id: m.id }}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:opacity-90"
          >
            ▶ Tomosha qilish
          </Link>
          <span className="text-sm text-muted-foreground">
            {m.year} {m.duration_minutes ? `• ${m.duration_minutes} daq` : ""} • {m.type}
          </span>
        </div>

        <div className="mt-8 flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === i ? "w-8 bg-primary" : "w-4 bg-muted-foreground/40 hover:bg-muted-foreground/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
