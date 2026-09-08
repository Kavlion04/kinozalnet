// Server-only Telegram helpers (gateway calls + broadcast to bot subscribers).
export const SITE_URL = "https://kinozalnet.lovable.app";

export async function tgCall(method: string, payload: unknown) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const tgKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableKey || !tgKey) throw new Error("Telegram credentials are not configured");
  const res = await fetch(`https://connector-gateway.lovable.dev/telegram/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`Telegram ${method} failed [${res.status}]: ${await res.text()}`);
    return false;
  }
  return true;
}

export async function notifyNewMovie(movie: {
  id: string;
  title: string;
  year: number | null;
  type: string;
  hasVideo: boolean;
}): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: subs } = await (supabaseAdmin.from("telegram_subscribers") as any)
    .select("chat_id")
    .eq("active", true)
    .limit(2000);
  const rows: { chat_id: number }[] = subs ?? [];
  if (rows.length === 0) return 0;

  const meta = [movie.year, movie.type, movie.hasVideo ? "📹 Video bor" : null]
    .filter(Boolean)
    .join(" · ");
  const text = `🆕 <b>Yangi kino qo'shildi!</b>\n\n🎬 <b>${movie.title}</b>${meta ? `\n${meta}` : ""}`;
  let sent = 0;
  for (const r of rows) {
    const ok = await tgCall("sendMessage", {
      chat_id: r.chat_id,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "▶️ Tomosha qilish", url: `${SITE_URL}/movie/${movie.id}` }]],
      },
    });
    if (ok) sent++;
  }
  return sent;
}
