import { Star } from "lucide-react";
import { useState } from "react";
import { useUserRating } from "@/lib/watch-progress";

export function StarRating({ movieId }: { movieId: string }) {
  const { value, set } = useUserRating(movieId);
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Sizning bahoyingiz</p>
          <p className="text-xs text-muted-foreground">
            {value ? "Bahoni o'zgartirish uchun yulduzni bosing" : "10 ballik tizimda baholang"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-background px-3 py-1 text-sm font-semibold tabular-nums">
            {active ? `${active}/10` : "—"}
          </span>
          {value > 0 && (
            <button
              onClick={() => set(0)}
              className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
            >
              tozalash
            </button>
          )}
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => set(value === n ? 0 : n)}
            className="rounded-md p-1 transition-transform hover:scale-125"
            aria-label={`${n} yulduz`}
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                n <= active
                  ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
                  : "text-muted-foreground/50"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
