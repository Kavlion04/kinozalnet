import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AppSelectOption = { value: string; label: string };

/** Themed dropdown matching the app's dark card design. */
export function AppSelect({
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  /** Label for the "all / reset" empty-value option. */
  allLabel?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const ALL = "__all__";
  return (
    <Select
      value={value === "" ? ALL : value}
      onValueChange={(v) => onChange(v === ALL ? "" : v)}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={`h-10 rounded-lg border-input bg-card text-sm shadow-sm transition hover:bg-accent/40 focus:border-primary ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="border-border bg-popover text-popover-foreground shadow-2xl">
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
