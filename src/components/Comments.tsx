import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag, MessageSquare, X } from "lucide-react";
import { listComments, addComment, type CommentDTO } from "@/lib/movies.functions";
import { reportComment, REPORT_REASONS } from "@/lib/admin.functions";
import { useHiddenComments } from "@/lib/playlists";

export function Comments({ movieId }: { movieId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listComments);
  const add = useServerFn(addComment);
  const report = useServerFn(reportComment);
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { hidden, hide } = useHiddenComments();

  const [reportFor, setReportFor] = useState<CommentDTO | null>(null);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", movieId],
    queryFn: () => list({ data: { movie_id: movieId } }) as Promise<CommentDTO[]>,
  });

  const mutation = useMutation({
    mutationFn: () =>
      add({ data: { movie_id: movieId, nickname: nickname.trim(), body: body.trim() } }),
    onSuccess: () => {
      setBody("");
      setError(null);
      qc.invalidateQueries({ queryKey: ["comments", movieId] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const reportMutation = useMutation({
    mutationFn: (v: { comment_id: string; reason: string; details: string | null }) =>
      report({ data: v }),
    onSuccess: (_d, v) => {
      setReportedIds((p) => [...p, v.comment_id]);
      setReportFor(null);
      setDetails("");
      qc.invalidateQueries({ queryKey: ["comments", movieId] });
    },
  });

  return (
    <div className="mt-12">
      <h2 className="mb-4 flex items-center gap-2 text-2xl">
        <MessageSquare className="h-6 w-6" /> Izohlar
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!nickname.trim() || !body.trim()) return;
          mutation.mutate();
        }}
        className="rounded-2xl border border-border bg-card p-4"
      >
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <input
            required
            maxLength={40}
            placeholder="Ismingiz"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <textarea
            required
            rows={3}
            maxLength={2000}
            placeholder="Fikringizni yozing..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {mutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
          </button>
        </div>
      </form>

      <ul className="mt-6 space-y-3">
        {comments
          .filter((c) => !hidden.includes(c.id))
          .map((c) => (
            <li key={c.id} className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{c.nickname}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                  {reportedIds.includes(c.id) ? (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                      Shikoyat yuborildi
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReportFor(c);
                        setReason(REPORT_REASONS[0]);
                        setDetails("");
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Shikoyat qilish"
                      title="Shikoyat qilish"
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{c.body}</p>
            </li>
          ))}
        {comments.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Hali izohlar yo'q. Birinchi bo'ling!
          </li>
        )}
      </ul>

      {reportFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Shikoyat qilish</h3>
                <p className="text-xs text-muted-foreground">
                  "{reportFor.nickname}" izohi moderatorga yuboriladi.
                </p>
              </div>
              <button
                onClick={() => setReportFor(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent"
                aria-label="Yopish"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    reason === r ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-primary"
                  />
                  {r}
                </label>
              ))}
            </div>

            <textarea
              rows={3}
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Qo'shimcha izoh (ixtiyoriy)"
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  hide(reportFor.id);
                  setReportFor(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Faqat yashirish
              </button>
              <button
                disabled={reportMutation.isPending}
                onClick={() =>
                  reportMutation.mutate({
                    comment_id: reportFor.id,
                    reason,
                    details: details.trim() || null,
                  })
                }
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                {reportMutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
