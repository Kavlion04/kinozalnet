import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Kirish — Kinozal admin panel" },
      {
        name: "description",
        content: "Kinozal moderatsiya paneliga kirish: email va parol yoki Google orqali.",
      },
      { property: "og:title", content: "Kirish — Kinozal" },
      { property: "og:description", content: "Kinozal moderatsiya paneliga kirish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email yoki parol xato. Agar Google bilan ro'yxatdan o'tgan bo'lsangiz, «Google bilan davom etish» tugmasidan foydalaning yoki parolni tiklang.";
  if (m.includes("email not confirmed"))
    return "Email hali tasdiqlanmagan. Pochtangizdagi tasdiqlash havolasini bosing.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Bu email allaqachon ro'yxatdan o'tgan. «Kirish» bo'limidan foydalaning yoki parolni tiklang.";
  if (m.includes("password")) return "Parol juda qisqa — kamida 6 belgi bo'lishi kerak.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/", replace: true });
          return;
        }
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setErr(
            "Bu email allaqachon ro'yxatdan o'tgan. «Kirish» bo'limidan foydalaning yoki parolni tiklang.",
          );
          return;
        }
        setMsg("Ro'yxatdan o'tdingiz. Emailingizni tasdiqlang, so'ng kiring.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      }
    } catch (e) {
      setErr(friendlyError(e instanceof Error ? e.message : "Xatolik yuz berdi"));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setErr(null);
    setMsg(null);
    if (!email) {
      setErr("Avval email manzilingizni kiriting.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setErr(friendlyError(error.message));
    else setMsg("Parolni tiklash havolasi emailingizga yuborildi.");
  };


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl">{mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}</h1>
            <p className="text-sm text-muted-foreground">Moderatsiya paneli uchun</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@misol.com"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          {msg && <p className="text-sm text-primary">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
          </button>

          <button
            type="button"
            onClick={() =>
              lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })
            }
            className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Google bilan davom etish
          </button>

          <p className="pt-1 text-center text-xs text-muted-foreground">
            {mode === "login" ? "Akkauntingiz yo'qmi?" : "Akkauntingiz bormi?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary underline"
            >
              {mode === "login" ? "Ro'yxatdan o'tish" : "Kirish"}
            </button>
          </p>
        </form>

        <Link to="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Bosh sahifa
        </Link>
      </div>
    </div>
  );
}
