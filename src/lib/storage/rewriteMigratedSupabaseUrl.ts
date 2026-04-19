/**
 * After migrating from another Supabase project, `family_files.file_url` (and
 * similar) may still point at the old project hostname. Rewrite to the current
 * app's public Supabase origin so links work when the bucket was copied or is public.
 */
export function rewriteMigratedSupabaseFileUrl(
  url: string | null | undefined,
): string {
  if (!url) return "";
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!base) return url;
  try {
    const origin = new URL(base).origin;
    return url.replace(/^https:\/\/[a-z0-9-]+\.supabase\.co/i, origin);
  } catch {
    return url;
  }
}
