import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag, MessageSquare } from "lucide-react";
import { listComments, addComment, type CommentDTO } from "@/lib/movies.functions";
import { useHiddenComments } from "@/lib/playlists";

export function Comments({ movieId }: { movieId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listComments);
  const add = useServerFn(addComment);
  const [nickname, setNickname] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { hidden, hide } = useHiddenComments();


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
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Bu izohni yashirishni istaysizmi?")) hide(c.id);
                    }}
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Shikoyat qilish"
                    title="Shikoyat qilish / yashirish"
                  >
                    <Flag className="h-3.5 w-3.5" />
                  </button>
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
    </div>
  );
}
