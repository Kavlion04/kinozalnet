import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";

const SITE_URL = "https://kinozalnet.lovable.app";

function deriveSecret(key: string) {
  return createHash("sha256").update(`telegram-webhook:${key}`).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const l = Buffer.from(a);
  const r = Buffer.from(b);
  return l.length === r.length && timingSafeEqual(l, r);
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init: any) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function sendMessage(chatId: number, text: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const tgKey = process.env["TELEGRAM_API_KEY"];
  if (!lovableKey || !tgKey) throw new Error("Telegram credentials are not configured");
  const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": tgKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Telegram sendMessage failed [${res.status}]: ${body}`);
  }
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const tgKey = process.env["TELEGRAM_API_KEY"];
        if (!tgKey) return new Response("Not configured", { status: 500 });

        const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(provided, deriveSecret(tgKey))) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json();
        const message = update.message ?? update.edited_message;
        const chatId = message?.chat?.id;
        const text: string = (message?.text ?? "").trim();
        if (!chatId) return Response.json({ ok: true, ignored: true });

        if (!text || text === "/start" || text === "/help") {
          await sendMessage(
            chatId,
            `🎬 <b>Kinozal botiga xush kelibsiz!</b>\n\nKino nomini yozing — men bazadan qidirib beraman.\n\nMasalan: <code>Interstellar</code>\n\nSayt: ${SITE_URL}`,
          );
          return Response.json({ ok: true });
        }

        const q = text.replace(/^\/search\s*/i, "").slice(0, 80);
        const sb = publicClient();
        const { data, error } = await sb
          .from("movies")
          .select("id, title, year, type, rating")
          .ilike("title", `%${q}%`)
          .limit(6);

        if (error) {
          console.error(`Movie search failed: ${error.message}`);
          await sendMessage(chatId, "❌ Qidiruvda xatolik yuz berdi. Keyinroq urinib ko'ring.");
          return Response.json({ ok: true });
        }

        if (!data || data.length === 0) {
          await sendMessage(
            chatId,
            `😕 <b>"${q}"</b> bo'yicha hech narsa topilmadi.\n\nBoshqa nom bilan urinib ko'ring yoki saytga kiring: ${SITE_URL}`,
          );
          return Response.json({ ok: true });
        }

        const lines = data.map((m: any) => {
          const meta = [m.year, m.type, m.rating ? `⭐ ${m.rating}` : null]
            .filter(Boolean)
            .join(" · ");
          return `🎬 <b>${m.title}</b>${meta ? `\n${meta}` : ""}\n▶️ ${SITE_URL}/movie/${m.id}`;
        });

        await sendMessage(
          chatId,
          `🔎 <b>"${q}"</b> bo'yicha ${data.length} natija:\n\n${lines.join("\n\n")}`,
        );
        return Response.json({ ok: true });
      },
    },
  },
});
