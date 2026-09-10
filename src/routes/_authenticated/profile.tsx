import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { History, LogOut, Trash2, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SafeImage } from "@/components/SafeImage";
import { useAuth } from "@/hooks/useAuth";
import {
  clearMyHistory,
  getMyProfile,
  listMyFavorites,
  listMyHistory,
  updateMyProfile,
  type HistoryRow,
  type ProfileDTO,
} from "@/lib/user-data.functions";
import { listMoviesByIds, type MovieDTO } from "@/lib/movies.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Mening profilim — Kinozal" },
      { name: "description", content: "Profil sozlamalari, tomosha tarixi va sevimlilar soni." },
      { property: "og:title", content: "Mening profilim — Kinozal" },
      { property: "og:description", content: "Profil va tomosha tarixi." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function ProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const profileFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(updateMyProfile);
  const favFn = useServerFn(listMyFavorites);
  const histFn = useServerFn(listMyHistory);
  const clearFn = useServerFn(clearMyHistory);

  const handleSignOut = async () => {
    await signOut();
    await qc.resetQueries();
    navigate({ to: "/" });
  };

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => profileFn({}) as Promise<ProfileDTO>,
  });
  const { data: favorites = [] } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favFn({}),
  });
  const { data: history = [] } = useQuery({
    queryKey: ["my-history"],
    queryFn: () => histFn({}) as Promise<HistoryRow[]>,
  });
  const { data: movies = [] } = useQuery({
    queryKey: ["history-movies", history.map((h) => h.movie_id).join(",")],
    queryFn: () =>
      listMoviesByIds({
        data: { ids: history.slice(0, 20).map((h) => h.movie_id) },
      }) as Promise<MovieDTO[]>,
    enabled: history.length > 0,
  });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  useEffect(() => {
    setName(profile?.display_name ?? "");
    setAvatar(profile?.avatar_url ?? "");
  }, [profile?.display_name, profile?.avatar_url]);

  const save = useMutation({
    mutationFn: () =>
      saveFn({ data: { display_name: name.trim() || null, avatar_url: avatar.trim() || null } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });
  const clear = useMutation({
    mutationFn: () => clearFn({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-history"] }),
  });

  const byId = new Map(movies.map((m) => [m.id, m]));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/15 text-primary">
              {profile?.avatar_url ? (
                <SafeImage
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  showIcon={false}
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl sm:text-3xl">
                {profile?.display_name || "Mening profilim"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {favorites.length} sevimli • {history.length} ta ko'rilgan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="mt-8 space-y-3 rounded-2xl border border-border bg-card p-5"
        >
          <h2 className="text-lg">Sozlamalar</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ko'rinadigan ism"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="Avatar rasm havolasi (https://...)"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-xl">
              <History className="h-5 w-5 text-muted-foreground" /> Tomosha tarixi
            </h2>
            {history.length > 0 && (
              <button
                onClick={() => clear.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Tozalash
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Hali tomosha tarixi yo'q.{" "}
              <Link to="/" className="text-primary underline">
                Kinolarni ko'rish
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => {
                const m = byId.get(h.movie_id);
                const pct =
                  h.duration_seconds && h.duration_seconds > 0
                    ? Math.min(100, (h.position_seconds / h.duration_seconds) * 100)
                    : 0;
                return (
                  <li key={h.movie_id} className="rounded-xl border border-border bg-card p-3">
                    <Link
                      to="/movie/$id"
                      params={{ id: h.movie_id }}
                      className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3"
                    >
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md">
                        <SafeImage
                          src={m?.poster_url}
                          alt={m?.title ?? "Kino"}
                          className="h-full w-full object-cover"
                          showIcon={false}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{m?.title ?? "Kino"}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt(h.position_seconds)} {h.completed ? "• ko'rib tugatilgan" : ""}
                        </p>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
