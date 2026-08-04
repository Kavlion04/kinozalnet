import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Eye, EyeOff, Check, Trash2, LogOut, Clock, Flag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AdminMovies } from "@/components/admin/AdminMovies";
import { AdminGenres } from "@/components/admin/AdminGenres";
import { supabase } from "@/integrations/supabase/client";
import {
  listReports,
  getModerationStats,
  getMyAdminStatus,
  setCommentStatus,
  setReportStatus,
  deleteComment,
  STATUS_LABELS,
  type ReportDTO,
  type CommentStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin panel — Izoh shikoyatlari | Kinozal" },
      {
        name: "description",
        content: "Kinozal moderatsiya paneli: izohlarga tushgan shikoyatlar va moderatsiya holati.",
      },
      { property: "og:title", content: "Admin panel — Kinozal" },
      { property: "og:description", content: "Izoh shikoyatlari va moderatsiya holati." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STATUS_STYLES: Record<CommentStatus, string> = {
  visible: "bg-primary/15 text-primary",
  pending: "bg-yellow-500/15 text-yellow-500",
  hidden: "bg-destructive/15 text-destructive",
};

function AdminPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const admin = useServerFn(getMyAdminStatus);
  const reports = useServerFn(listReports);
  const stats = useServerFn(getModerationStats);
  const setStatus = useServerFn(setCommentStatus);
  const setRep = useServerFn(setReportStatus);
  const delComment = useServerFn(deleteComment);
  const [tab, setTab] = useState<"open" | "reviewed" | "all">("open");
  const [section, setSection] = useState<"reports" | "movies" | "genres">("reports");

  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["admin-status"],
    queryFn: () => admin({}),
  });
  const isAdmin = me?.isAdmin === true;

  const { data: statData } = useQuery({
    queryKey: ["moderation-stats"],
    queryFn: () => stats({}),
    enabled: isAdmin,
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["reports", tab],
    queryFn: () => reports({ data: { status: tab } }) as Promise<ReportDTO[]>,
    enabled: isAdmin,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["reports"] });
    qc.invalidateQueries({ queryKey: ["moderation-stats"] });
  };

  const statusMutation = useMutation({
    mutationFn: (v: { comment_id: string; status: CommentStatus }) => setStatus({ data: v }),
    onSuccess: refresh,
  });
  const reportMutation = useMutation({
    mutationFn: (v: { report_id: string; status: "reviewed" | "dismissed" }) =>
      setRep({ data: v }),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (v: { comment_id: string }) => delComment({ data: v }),
    onSuccess: refresh,
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (meLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <p className="p-10 text-center text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-2xl">Ruxsat yo'q</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bu sahifa faqat adminlar uchun. Sizning foydalanuvchi IDingiz:
          </p>
          <code className="mt-2 block break-all rounded-lg bg-secondary p-3 text-xs">
            {me?.userId}
          </code>
          <p className="mt-3 text-xs text-muted-foreground">
            Admin huquqini olish uchun bu ID uchun "admin" roli berilishi kerak.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/" className="rounded-lg border border-border px-4 py-2 text-sm">
              Bosh sahifa
            </Link>
            <button
              onClick={signOut}
              className="rounded-lg bg-secondary px-4 py-2 text-sm hover:bg-accent"
            >
              Chiqish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl">Admin panel</h1>
              <p className="text-sm text-muted-foreground">Kinolar, janrlar va moderatsiya</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Chiqish
          </button>
        </div>

        <div className="mb-6 flex gap-2 border-b border-border pb-2">
          {(
            [
              ["reports", "Shikoyatlar"],
              ["movies", "Kinolar"],
              ["genres", "Janrlar"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSection(k)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                section === k
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {section === "movies" && <AdminMovies />}
        {section === "genres" && <AdminGenres />}

        {section === "reports" && (
          <>
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Yangi shikoyat", value: statData?.open ?? 0, icon: Flag },
            { label: "Ko'rib chiqilgan", value: statData?.reviewed ?? 0, icon: Check },
            { label: "Tekshirilmoqda", value: statData?.pending ?? 0, icon: Clock },
            { label: "Yashirilgan", value: statData?.hidden ?? 0, icon: EyeOff },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-2 text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex gap-2">
          {(["open", "reviewed", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-2 text-sm ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-secondary text-muted-foreground hover:bg-accent"
              }`}
            >
              {t === "open" ? "Yangi" : t === "reviewed" ? "Ko'rilgan" : "Hammasi"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Yuklanmoqda...</p>

        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Shikoyatlar yo'q.
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-destructive/15 px-2 py-1 text-xs font-medium text-destructive">
                    {r.reason}
                  </span>
                  {r.comment && (
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.comment.status]}`}
                    >
                      {STATUS_LABELS[r.comment.status]}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {r.comment?.report_count ?? 0} shikoyat
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>

                {r.details && (
                  <p className="mt-2 text-xs italic text-muted-foreground">"{r.details}"</p>
                )}

                <div className="mt-3 rounded-lg border border-border/60 bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{r.comment?.nickname}</p>
                    {r.comment && (
                      <Link
                        to="/movie/$id"
                        params={{ id: r.comment.movie_id }}
                        className="text-xs text-primary underline"
                      >
                        {r.movie_title ?? "Kino"}
                      </Link>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {r.comment?.body}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.comment && r.comment.status !== "hidden" && (
                    <button
                      onClick={() =>
                        statusMutation.mutate({ comment_id: r.comment!.id, status: "hidden" })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <EyeOff className="h-3.5 w-3.5" /> Yashirish
                    </button>
                  )}
                  {r.comment && r.comment.status !== "visible" && (
                    <button
                      onClick={() =>
                        statusMutation.mutate({ comment_id: r.comment!.id, status: "visible" })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      <Eye className="h-3.5 w-3.5" /> Tiklash
                    </button>
                  )}
                  {r.status === "open" && (
                    <>
                      <button
                        onClick={() => reportMutation.mutate({ report_id: r.id, status: "reviewed" })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                      >
                        <Check className="h-3.5 w-3.5" /> Ko'rib chiqildi
                      </button>
                      <button
                        onClick={() =>
                          reportMutation.mutate({ report_id: r.id, status: "dismissed" })
                        }
                        className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent"
                      >
                        Rad etish
                      </button>
                    </>
                  )}
                  {r.comment && (
                    <button
                      onClick={() => {
                        if (confirm("Izoh butunlay o'chirilsinmi?"))
                          deleteMutation.mutate({ comment_id: r.comment!.id });
                      }}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> O'chirish
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
          </>
        )}
      </div>
    </div>
  );
}
