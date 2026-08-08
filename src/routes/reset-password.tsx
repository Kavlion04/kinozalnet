import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Parolni tiklash — Kinozal" },
      { name: "description", content: "Kinozal akkaunti uchun yangi parol o'rnatish sahifasi." },
      { property: "og:title", content: "Parolni tiklash — Kinozal" },
      { property: "og:description", content: "Yangi parol o'rnatib akkauntingizga qayting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMsg("Parol yangilandi. Endi kirishingiz mumkin.");
    setTimeout(() => navigate({ to: "/", replace: true }), 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="text-3xl">Yangi parol</h1>
        </div>

        {!ready ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Havola tekshirilmoqda... Agar bu yerda qolib qolsa, emaildagi tiklash havolasini yana
            bir marta bosing.
          </p>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
          >
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Yangi parol (kamida 6 belgi)"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
            {msg && <p className="text-sm text-primary">{msg}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Saqlash
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
