/**
 * After migrating from another Supabase project, `family_files.file_url` (and
 * similar) may still point at the old project hostname. Rewrite to the current
 * app's public Supabase origin so links work when the bucket was copied or is public.
 */
export function rewriteMigratedSupabaseFileUrl(url) {
    var _a;
    if (!url)
        return "";
    const base = (_a = process.env.NEXT_PUBLIC_SUPABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (!base)
        return url;
    try {
        const origin = new URL(base).origin;
        return url.replace(/^https:\/\/[a-z0-9-]+\.supabase\.co/i, origin);
    }
    catch (_b) {
        return url;
    }
}
