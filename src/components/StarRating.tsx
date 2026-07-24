import { Star } from "lucide-react";
import { useState } from "react";
import { useUserRating } from "@/lib/watch-progress";

export function StarRating({ movieId }: { movieId: string }) {
  const { value, set } = useUserRating(movieId);
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
      <div className="text-sm text-muted-foreground">Sizning bahoyingiz</div>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => set(value === n ? 0 : n)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${n} yulduz`}
          >
            <Star
              className={`h-5 w-5 ${
                n <= active ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-foreground">{value ? `${value}/10` : "—"}</span>
        {value > 0 && (
          <button
            onClick={() => set(0)}
            className="ml-2 text-xs text-muted-foreground underline hover:text-foreground"
          >
            tozalash
          </button>
        )}
      </div>
    </div>
  );
}
