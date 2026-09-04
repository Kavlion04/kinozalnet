import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export const REPORT_REASONS = [
  "Haqoratli so'zlar",
  "Spam / reklama",
  "Spoyler",
  "Nafrat / tahdid",
  "Boshqa",
] as const;

export const COMMENT_STATUSES = ["visible", "pending", "hidden"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const STATUS_LABELS: Record<CommentStatus, string> = {
  visible: "Ko'rinadi",
  pending: "Tekshirilmoqda",
  hidden: "Yashirilgan",
};

export type ReportDTO = {
  id: string;
  comment_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
  comment: {
    id: string;
    movie_id: string;
    nickname: string;
    body: string;
    created_at: string;
    status: CommentStatus;
    report_count: number;
    moderation_note: string | null;
  } | null;
  movie_title: string | null;
};

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Anyone (also anonymous) can file a report about a comment. */
export const reportComment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        comment_id: z.string().uuid(),
        reason: z.string().trim().min(1).max(60),
        details: z.string().trim().max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const sb = publicClient();
    const { error } = await (sb.from("comment_reports") as any).insert({
      comment_id: data.comment_id,
      reason: data.reason,
      details: data.details || null,
      status: "open",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Is the signed-in caller an admin? */
export const getMyAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean; userId: string }> => {
    const { data } = await (context.supabase.rpc as any)("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true, userId: context.userId };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (data !== true) throw new Error("Forbidden: admin huquqi yo'q");
}

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({ status: z.enum(["open", "reviewed", "dismissed", "all"]).default("open") })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<ReportDTO[]> => {
    await assertAdmin(context as any);
    const sb = context.supabase as any;
    let q = sb
      .from("comment_reports")
      .select(
        "id, comment_id, reason, details, status, created_at, comments!inner(id, movie_id, nickname, body, created_at, status, report_count, moderation_note)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const movieIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.comments?.movie_id).filter(Boolean)),
    );
    const titles = new Map<string, string>();
    if (movieIds.length > 0) {
      const { data: movies } = await sb.from("movies").select("id, title").in("id", movieIds);
      (movies ?? []).forEach((m: any) => titles.set(m.id, m.title));
    }

    return (rows ?? []).map((r: any) => ({
      id: r.id,
      comment_id: r.comment_id,
      reason: r.reason,
      details: r.details,
      status: r.status,
      created_at: r.created_at,
      comment: r.comments ?? null,
      movie_title: r.comments ? (titles.get(r.comments.movie_id) ?? null) : null,
    }));
  });

export const getModerationStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ open: number; reviewed: number; pending: number; hidden: number }> => {
      await assertAdmin(context as any);
      const sb = context.supabase as any;
      const count = async (table: string, col: string, value: string) => {
        const { count: c } = await sb
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq(col, value);
        return c ?? 0;
      };
      const [open, reviewed, pending, hidden] = await Promise.all([
        count("comment_reports", "status", "open"),
        count("comment_reports", "status", "reviewed"),
        count("comments", "status", "pending"),
        count("comments", "status", "hidden"),
      ]);
      return { open, reviewed, pending, hidden };
    },
  );

export const setCommentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        comment_id: z.string().uuid(),
        status: z.enum(COMMENT_STATUSES),
        note: z.string().trim().max(500).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context as any);
    const { error } = await (context.supabase.from("comments") as any)
      .update({
        status: data.status,
        moderation_note: data.note || null,
        moderated_at: new Date().toISOString(),
        moderated_by: context.userId,
      })
      .eq("id", data.comment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setReportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        report_id: z.string().uuid(),
        status: z.enum(["open", "reviewed", "dismissed"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context as any);
    const { error } = await (context.supabase.from("comment_reports") as any)
      .update({
        status: data.status,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.report_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ comment_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context as any);
    const { error } = await (context.supabase.from("comments") as any)
      .delete()
      .eq("id", data.comment_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type AdminUserDTO = {
  id: string;
  display_name: string | null;
  created_at: string;
  roles: string[];
};

/** List profiles with their roles (admins only). */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserDTO[]> => {
    await assertAdmin(context as any);
    const sb = context.supabase as any;
    const { data: profiles, error } = await sb
      .from("profiles")
      .select("id, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const { data: roles } = await sb.from("user_roles").select("user_id, role");
    const byUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), r.role]);
    });
    return (profiles ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      created_at: p.created_at,
      roles: byUser.get(p.id) ?? [],
    }));
  });

/** Grant or revoke a role for a user (admins only). */
export const setUserRole = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "moderator", "user"]),
        grant: z.boolean(),
      })
      .parse(input),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context as any);
    const sb = context.supabase as any;
    if (data.user_id === context.userId && data.role === "admin" && !data.grant) {
      throw new Error("O'zingizdan admin huquqini olib tashlay olmaysiz");
    }
    if (data.grant) {
      const { error } = await sb
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
