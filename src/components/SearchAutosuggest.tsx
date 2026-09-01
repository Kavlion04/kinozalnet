import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Star, X } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { listMovies, type MovieDTO } from "@/lib/movies.functions";

/** Search input with debounced autosuggest dropdown. */
export function SearchAutosuggest({
  value,
  onChange,
  placeholder = "Kino nomini qidiring...",
  autoFocus,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState(value);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce the suggestion query.
  useEffect(() => {
    const t = setTimeout(() => setTerm(value.trim()), 250);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["suggest", term],
    queryFn: () => listMovies({ data: { q: term, sort: "rating" } }) as Promise<MovieDTO[]>,
    enabled: term.length >= 2,
    staleTime: 60_000,
  });

  const items = useMemo(() => (data ?? []).slice(0, 8), [data]);
  const show = open && value.trim().length >= 2;

  const go = (m: MovieDTO) => {
    setOpen(false);
    navigate({ to: "/movie/$id", params: { id: m.id } });
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        role="combobox"
        aria-expanded={show}
        aria-label="Kino qidirish"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && active >= 0 && items[active]) {
            e.preventDefault();
            go(items[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-xl border border-input bg-background py-3 pl-11 pr-10 text-sm outline-none transition focus:border-primary"
      />
      {value && (
        <button
          type="button"
          aria-label="Tozalash"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {show && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {isFetching && items.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Qidirilmoqda...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              "{value}" bo'yicha moslik yo'q.
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.map((m, i) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(m)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                      i === active ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      <SafeImage
                        src={m.poster_url}
                        alt={m.title}
                        label={m.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">{m.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {m.year ?? "—"} • {m.type}
                        {m.genre[0] ? ` • ${m.genre[0]}` : ""}
                      </p>
                    </div>
                    {m.rating != null && (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--color-gold)]">
                        <Star className="h-3 w-3 fill-[var(--color-gold)]" />
                        {m.rating.toFixed(1)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
