import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Film, Heart, MessageSquare, Users, Play, Send, Tags, Video } from "lucide-react";
import { getSiteStats, type SiteStatsDTO } from "@/lib/stats.functions";

export function AdminStats() {
  const fetchStats = useServerFn(getSiteStats);
  const { data, isLoading } = useQuery({
    queryKey: ["site-stats"],
    queryFn: () => fetchStats({}) as Promise<SiteStatsDTO>,
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>;
  }

  const cards = [
    { label: "Kinolar", value: data.movies, icon: Film },
    { label: "Videosi bor", value: data.moviesWithVideo, icon: Video },
    { label: "Janrlar", value: data.genres, icon: Tags },
    { label: "Foydalanuvchilar", value: data.users, icon: Users },
    { label: "Izohlar", value: data.comments, icon: MessageSquare },
    { label: "Sevimlilar", value: data.favorites, icon: Heart },
    { label: "Ko'rishlar", value: data.watchSessions, icon: Play },
    { label: "Bot obunachilari", value: data.telegramSubscribers, icon: Send },
  ];

  const list = (title: string, rows: { id: string; title: string; count: number }[]) => (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Hozircha ma'lumot yo'q.</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
              <span className="font-semibold text-primary">{r.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <c.icon className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list("Eng ko'p sevimliga qo'shilganlar", data.topFavorites)}
        {list("Eng ko'p ko'rilganlar", data.topWatched)}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Turlar bo'yicha</h3>
        <ul className="flex flex-wrap gap-2">
          {data.byType.map((t) => (
            <li
              key={t.type}
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs"
            >
              {t.type} · <span className="font-semibold text-primary">{t.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
