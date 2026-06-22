import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SIGN_EXPIRY = 60 * 60 * 24 * 7; // 7 days

export const getMyReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("id,title,category,severity,status,city,province,created_at")
      .eq("reporter_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminListReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (rolesErr) throw new Error(rolesErr.message);
    const allowed = (roles ?? []).some((r) => r.role === "admin" || r.role === "authority");
    if (!allowed) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("id,title,category,severity,status,province,city,created_at,reporter_id")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const signReportPhotos = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ paths: z.array(z.string()).max(100) }).parse(d))
  .handler(async ({ data }) => {
    if (data.paths.length === 0) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only sign paths that actually belong to a stored report image.
    const { data: rows, error: rowsErr } = await supabaseAdmin
      .from("report_images")
      .select("storage_path")
      .in("storage_path", data.paths);
    if (rowsErr) throw new Error(rowsErr.message);
    const valid = new Set((rows ?? []).map((r) => r.storage_path));
    const allowed = data.paths.filter((p) => valid.has(p));
    if (allowed.length === 0) return {} as Record<string, string>;

    const { data: signed, error } = await supabaseAdmin.storage
      .from("report-photos")
      .createSignedUrls(allowed, SIGN_EXPIRY);
    if (error) throw new Error(error.message);

    const result: Record<string, string> = {};
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) result[s.path] = s.signedUrl;
    }
    return result;
  });
