import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Shield, User, Search } from "lucide-react";
import { listUsers, setUserRole, type AdminUserDTO } from "@/lib/admin.functions";

const ROLES = [
  { key: "admin" as const, label: "Admin", icon: ShieldCheck },
  { key: "moderator" as const, label: "Moderator", icon: Shield },
];

export function AdminUsers() {
  const qc = useQueryClient();
  const load = useServerFn(listUsers);
  const setRole = useServerFn(setUserRole);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => load({}) as Promise<AdminUserDTO[]>,
  });

  const mutate = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "moderator"; grant: boolean }) =>
      setRole({ data: v }),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const term = q.trim().toLowerCase();
  const filtered = term
    ? users.filter(
        (u) => (u.display_name ?? "").toLowerCase().includes(term) || u.id.includes(term),
      )
    : users;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Foydalanuvchi ismi yoki ID"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} ta foydalanuvchi</p>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Foydalanuvchi topilmadi.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((u) => (
            <li key={u.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {u.display_name || "Ismsiz foydalanuvchi"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()} • {u.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {ROLES.map((r) => {
                    const active = u.roles.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        type="button"
                        disabled={mutate.isPending}
                        onClick={() =>
                          mutate.mutate({ user_id: u.id, role: r.key, grant: !active })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          active
                            ? "border-primary/50 bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <r.icon className="h-3.5 w-3.5" /> {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
