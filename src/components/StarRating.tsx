import { Star } from "lucide-react";
import { useState } from "react";
import { useUserRating } from "@/lib/watch-progress";

export function StarRating({ movieId }: { movieId: string }) {
  const { value, set } = useUserRating(movieId);
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 sm:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Sizning bahoyingiz</p>
          <p className="text-xs text-muted-foreground">
            {value
              ? "Ballni o'zgartirish uchun chiziqni bosing"
              : "10 ballik tizimda baholang"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-baseline gap-1 rounded-xl bg-background px-3 py-1.5 tabular-nums">
            <Star className="h-4 w-4 self-center fill-[var(--color-gold)] text-[var(--color-gold)]" />
            <span className="text-lg font-bold">{active || "—"}</span>
            <span className="text-xs text-muted-foreground">/10</span>
          </span>
        </div>
      </div>

      {/* Segmented 10-point bar — compact, never wraps */}
      <div
        className="mt-4 flex items-stretch gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => set(value === n ? 0 : n)}
            aria-label={`${n} ball`}
            className="group flex-1 py-2"
          >
            <span
              className={`block h-2.5 rounded-full transition-all group-hover:h-3.5 ${
                n <= active
                  ? "bg-[var(--color-gold)]"
                  : "bg-muted-foreground/25"
              }`}
            />
          </button>
        ))}
      </div>

      {value > 0 && (
        <button
          onClick={() => set(0)}
          className="mt-1 text-xs text-muted-foreground underline transition-colors hover:text-foreground"
        >
          Bahoni tozalash
        </button>
      )}
    </div>
  );
}
