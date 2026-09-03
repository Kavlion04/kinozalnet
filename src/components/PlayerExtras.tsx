import { useState } from "react";
import { Maximize, Timer } from "lucide-react";
import { parseTimeInput } from "@/lib/time";

/** Vaqt kiritish (masalan 12:30) va to'liq oynaga o'tish tugmalari. */
export function PlayerExtras({
  onSeek,
  onFullscreen,
}: {
  onSeek: (seconds: number) => void;
  onFullscreen: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const go = () => {
    const secs = parseTimeInput(value);
    if (secs == null) {
      setError(true);
      return;
    }
    setError(false);
    onSeek(secs);
  };

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Timer className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                go();
              }
            }}
            inputMode="numeric"
            placeholder="12:30"
            aria-label="Ko'rish vaqtini kiriting"
            className={`w-32 rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary ${
              error ? "border-destructive" : "border-input"
            }`}
          />
        </div>
        <button
          type="button"
          onClick={go}
          className="rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          Shu vaqtdan
        </button>
      </div>
      <button
        type="button"
        onClick={onFullscreen}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold hover:bg-accent"
      >
        <Maximize className="h-4 w-4" /> To'liq oyna
      </button>
      {error && <span className="text-xs text-destructive">Format: 90, 1:30 yoki 1:20:05</span>}
    </div>
  );
}
