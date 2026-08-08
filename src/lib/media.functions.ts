import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MEDIA_BUCKET = "media";

/**
 * Resolves a stored media reference to a playable URL.
 * Absolute http(s) links are returned as-is; bucket paths are signed.
 */
export const getMediaUrl = createServerFn({ method: "GET" })
  .validator((input: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(input))
  .handler(async ({ data }): Promise<{ url: string | null }> => {
    const raw = data.path.trim();
    if (/^https?:\/\//i.test(raw)) return { url: raw };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(raw.replace(/^\/+/, ""), 60 * 60 * 6);
    if (error) return { url: null };
    return { url: signed?.signedUrl ?? null };
  });

/** Admin-only: remove an uploaded object from the media bucket. */
export const deleteMediaObject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { data: isAdmin } = await (context.supabase.rpc as any)("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) throw new Error("Faqat admin uchun");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(MEDIA_BUCKET).remove([data.path.replace(/^\/+/, "")]);
    return { ok: true };
  });
