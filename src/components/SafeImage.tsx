import { useEffect, useState } from "react";
import { Film } from "lucide-react";

/**
 * Image that gracefully falls back to a branded placeholder when the URL is
 * missing or fails to load (dead poster links, hotlink-blocked hosts, 404s).
 */
export function SafeImage({
  src,
  alt,
  label,
  className,
  fallbackClassName,
  loading = "lazy",
  showIcon = true,
}: {
  src?: string | null;
  alt: string;
  label?: string | null;
  className?: string;
  fallbackClassName?: string;
  loading?: "lazy" | "eager";
  showIcon?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const usable = typeof src === "string" && /^https?:\/\//i.test(src.trim()) && !failed;

  if (!usable) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-card px-3 text-center ${fallbackClassName ?? ""}`}
        aria-label={alt}
        role="img"
      >
        {showIcon && <Film className="h-6 w-6 text-muted-foreground" />}
        {label && <span className="line-clamp-2 text-xs text-muted-foreground">{label}</span>}
      </div>
    );
  }

  return (
    <img
      src={src!.trim()}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
