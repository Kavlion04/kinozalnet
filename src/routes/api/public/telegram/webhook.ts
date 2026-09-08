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

async function tg(method: string, payload: unknown) {
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
  if (!res.ok) console.error(`Telegram ${method} failed [${res.status}]: ${await res.text()}`);
}

async function searchMovies(q: string) {
  const sb = publicClient();
  return await sb
    .from("movies")
    .select("id, title, year, type, rating, poster_url, video_url, full_youtube_id")
    .ilike("title", `%${q}%`)
    .limit(10);
}

const hasVideo = (m: any) => Boolean(m.video_url || m.full_youtube_id);
const metaLine = (m: any) =>
  [m.year, m.type, m.rating ? `⭐ ${m.rating}` : null, hasVideo(m) ? "📹 Video bor" : null]
    .filter(Boolean)
    .join(" · ");

const PAGE_SIZE = 6;

/** Bir sahifa kinolar: janr bo'yicha (bo'sh bo'lsa hammasi), video borlari birinchi. */
async function browsePage(page: number, genre: string) {
  const sb = publicClient();
  let q = sb
    .from("movies")
    .select("id, title, year, type, rating, video_url, full_youtube_id", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  if (genre) q = q.contains("genre", [genre]);
  const { data, count, error } = await q;
  return { rows: (data ?? []) as any[], total: count ?? 0, error };
}

function browseView(rows: any[], total: number, page: number, genre: string) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const head = genre ? `🏷 <b>${genre}</b>` : "🎬 <b>Barcha kinolar</b>";
  const text =
    rows.length === 0
      ? `${head}\n\n😕 Bu bo'limda kino topilmadi.`
      : `${head} — ${total} ta · sahifa ${page + 1}/${pages}\n\n${rows
          .map((m) => `🎬 <b>${m.title}</b>\n${metaLine(m)}`)
          .join("\n\n")}`;
  const keyboard: any[][] = rows.map((m) => [
    {
      text: `${hasVideo(m) ? "▶️" : "🎬"} ${String(m.title).slice(0, 30)}`,
      url: `${SITE_URL}/movie/${m.id}`,
    },
  ]);
  const nav: any[] = [];
  if (page > 0) nav.push({ text: "⬅️ Oldingi", callback_data: `br:${page - 1}:${genre}` });
  if (page + 1 < pages) nav.push({ text: "Keyingi ➡️", callback_data: `br:${page + 1}:${genre}` });
  if (nav.length) keyboard.push(nav);
  keyboard.push([{ text: "🏷 Janrlar", callback_data: "genres" }]);
  return { text, keyboard };
}

async function genresKeyboard() {
  const sb = publicClient();
  const { data } = await sb.from("genres").select("name").order("name").limit(40);
  const names = (data ?? []).map((g: any) => String(g.name));
  const rows: any[][] = [];
  for (let i = 0; i < names.length; i += 2) {
    rows.push(
      names.slice(i, i + 2).map((n) => ({ text: n, callback_data: `br:0:${n.slice(0, 40)}` })),
    );
  }
  rows.push([{ text: "🎬 Hammasi", callback_data: "br:0:" }]);
  return rows;
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

        // Inline rejim: @KinozalX_bot <nom> — yozgan sari natijalar yangilanadi
        if (update.inline_query) {
          const iq = update.inline_query;
          const iquery = String(iq.query ?? "").trim().slice(0, 80);
          let results: any[] = [];
          if (iquery.length >= 2) {
            const { data } = await searchMovies(iquery);
            results = (data ?? []).map((m: any) => {
              const meta = metaLine(m);
              return {
                type: "article",
                id: String(m.id),
                title: m.title,
                description: meta,
                thumbnail_url: m.poster_url ?? undefined,
                input_message_content: {
                  message_text: `🎬 <b>${m.title}</b>${meta ? `\n${meta}` : ""}`,
                  parse_mode: "HTML",
                },
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "▶️ Tomosha qilish", url: `${SITE_URL}/movie/${m.id}` }],
                    [{ text: "➕ To'plamga qo'sh", url: `${SITE_URL}/movie/${m.id}?add=1` }],
                  ],
                },
              };
            });
          }
          await tg("answerInlineQuery", {
            inline_query_id: iq.id,
            results,
            cache_time: 10,
            is_personal: true,
            button:
              iquery.length < 2
                ? { text: "Kino nomini yozing…", start_parameter: "help" }
                : undefined,
          });
          return Response.json({ ok: true });
        }

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
          const meta = metaLine(mm);
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
            `🎬 <b>Kinozal botiga xush kelibsiz!</b>\n\nKino nomini yozing — men bazadan topib, to'g'ridan-to'g'ri tomosha qilish tugmasini yuboraman.\n\nMasalan: <code>Interstellar</code>\n\n📹 /filmlar — to'liq videosi bor kinolar ro'yxati`,
            [[{ text: "🍿 Kinozal saytiga o'tish", url: SITE_URL }]],
          );
          return Response.json({ ok: true });
        }

        // /filmlar — faqat to'liq videosi (yuklangan yoki YouTube) bor kinolar
        if (/^\/(filmlar|videos)/i.test(text)) {
          const sb = publicClient();
          const { data: all, error: listErr } = await sb
            .from("movies")
            .select("id, title, year, type, rating, video_url, full_youtube_id")
            .order("created_at", { ascending: false })
            .limit(100);
          if (listErr) {
            console.error(`Movie list failed: ${listErr.message}`);
            await sendMessage(chatId, "❌ Xatolik yuz berdi. Keyinroq urinib ko'ring.");
            return Response.json({ ok: true });
          }
          const withVideo = (all ?? []).filter(hasVideo).slice(0, 8);
          if (withVideo.length === 0) {
            await sendMessage(chatId, "😕 Hozircha videosi bor kinolar yo'q.", [
              [{ text: "🎬 Saytga o'tish", url: SITE_URL }],
            ]);
            return Response.json({ ok: true });
          }
          const vlines = withVideo.map(
            (m: any) => `🎬 <b>${m.title}</b>\n${metaLine(m)}`,
          );
          const vkeyboard: InlineKeyboard = withVideo.map((m: any) => [
            { text: `▶️ ${String(m.title).slice(0, 30)}`, url: `${SITE_URL}/movie/${m.id}` },
          ]);
          await sendMessage(
            chatId,
            `📹 <b>Videosi bor kinolar</b> (${withVideo.length} ta):\n\n${vlines.join("\n\n")}\n\nTomosha qilish uchun tugmani bosing 👇`,
            vkeyboard,
          );
          return Response.json({ ok: true });
        }

        const q = text.replace(/^\/search\s*/i, "").slice(0, 80);
        const { data: found, error } = await searchMovies(q);
        const data = (found ?? []).slice(0, 5);


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
          const meta = metaLine(m);
          return `🎬 <b>${m.title}</b>${meta ? `\n${meta}` : ""}`;
        });

        const keyboard: InlineKeyboard = data.flatMap((m: any) => [
          [{ text: `▶️ ${String(m.title).slice(0, 30)}`, url: `${SITE_URL}/movie/${m.id}` }],
          [{ text: `➕ To'plamga qo'sh`, url: `${SITE_URL}/movie/${m.id}?add=1` }],
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
