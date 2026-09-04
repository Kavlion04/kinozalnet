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

type InlineKeyboard = { text: string; url: string }[][];

async function sendMessage(chatId: number, text: string, keyboard?: InlineKeyboard) {
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
      ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
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

        // Deep link: /start movie_<uuid> -> send that movie card directly
        const deep = /^\/start\s+movie_([0-9a-f-]{36})$/i.exec(text);
        if (deep) {
          const sbDeep = publicClient();
          const { data: m } = await sbDeep
            .from("movies")
            .select("id, title, year, type, rating, description")
            .eq("id", deep[1]!)
            .maybeSingle();
          if (!m) {
            await sendMessage(chatId, "😕 Bu kino topilmadi.", [
              [{ text: "🎬 Saytga o'tish", url: SITE_URL }],
            ]);
            return Response.json({ ok: true });
          }
          const mm = m as any;
          const meta = [mm.year, mm.type, mm.rating ? `⭐ ${mm.rating}` : null]
            .filter(Boolean)
            .join(" · ");
          await sendMessage(
            chatId,
            `🎬 <b>${mm.title}</b>${meta ? `\n${meta}` : ""}${
              mm.description ? `\n\n${String(mm.description).slice(0, 400)}` : ""
            }`,
            [[{ text: "▶️ Tomosha qilish", url: `${SITE_URL}/movie/${mm.id}` }]],
          );
          return Response.json({ ok: true });
        }

        if (!text || text === "/start" || text === "/help") {
          await sendMessage(
            chatId,
            `🎬 <b>Kinozal botiga xush kelibsiz!</b>\n\nKino nomini yozing — men bazadan topib, to'g'ridan-to'g'ri tomosha qilish tugmasini yuboraman.\n\nMasalan: <code>Interstellar</code>`,
            [[{ text: "🍿 Kinozal saytiga o'tish", url: SITE_URL }]],
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
            `😕 <b>"${q}"</b> bo'yicha hech narsa topilmadi.\n\nBoshqa nom bilan urinib ko'ring.`,
            [[{ text: "🔎 Saytda qidirish", url: `${SITE_URL}/search?title=${encodeURIComponent(q)}` }]],
          );
          return Response.json({ ok: true });
        }

        const lines = data.map((m: any) => {
          const meta = [m.year, m.type, m.rating ? `⭐ ${m.rating}` : null]
            .filter(Boolean)
            .join(" · ");
          return `🎬 <b>${m.title}</b>${meta ? `\n${meta}` : ""}`;
        });

        const keyboard: InlineKeyboard = data.map((m: any) => [
          { text: `▶️ ${String(m.title).slice(0, 40)}`, url: `${SITE_URL}/movie/${m.id}` },
        ]);

        await sendMessage(
          chatId,
          `🔎 <b>"${q}"</b> bo'yicha ${data.length} natija:\n\n${lines.join("\n\n")}\n\nTomosha qilish uchun pastdagi tugmani bosing 👇`,
          keyboard,
        );
        return Response.json({ ok: true });
      },
    },
  },
});
