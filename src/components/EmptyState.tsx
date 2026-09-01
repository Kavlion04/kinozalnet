import { Link } from "@tanstack/react-router";
import { SearchX, RotateCcw, Compass } from "lucide-react";

export function EmptyState({
  title = "Hech narsa topilmadi",
  description = "Boshqa so'z yozib ko'ring yoki filtrlarni tozalang.",
  onReset,
  onRetry,
  suggestions = [],
  onSuggestion,
}: {
  title?: string;
  description?: string;
  onReset?: () => void;
  onRetry?: () => void;
  suggestions?: string[];
  onSuggestion?: (s: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-12 text-center sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-border bg-secondary text-primary">
        <SearchX className="h-7 w-7" />
      </div>
      <h3 className="relative mt-5 text-xl font-semibold text-foreground">{title}</h3>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>

      {suggestions.length > 0 && (
        <div className="relative mt-5 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion?.(s)}
              className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Filtrlarni tozalash
          </button>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            Qayta urinish
          </button>
        )}
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Compass className="h-4 w-4" />
          Barcha kinolar
        </Link>
      </div>
    </div>
  );
}
