import { supabase } from "@/integrations/supabase/client";

const SIGN_EXPIRY = 60 * 60 * 24 * 7; // 7 days

const cache = new Map<string, { url: string; expires: number }>();

export async function signImagePaths(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const need: string[] = [];
  const result: Record<string, string> = {};

  for (const p of paths) {
    const c = cache.get(p);
    if (c && c.expires > now) result[p] = c.url;
    else need.push(p);
  }
  if (need.length === 0) return result;

  const { data } = await supabase.storage.from("report-photos").createSignedUrls(need, SIGN_EXPIRY);
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) {
      cache.set(entry.path, { url: entry.signedUrl, expires: now + SIGN_EXPIRY * 1000 - 60_000 });
      result[entry.path] = entry.signedUrl;
    }
  }
  return result;
}
