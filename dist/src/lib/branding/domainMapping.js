/**
 * Edge-safe stub: map hostname → tenant id via `ZIRO_BRANDING_DOMAIN_MAP`
 * (JSON object of host → tenant UUID). Production can replace with KV/DB
 * lookup outside the Edge bundle.
 *
 * Recommended DB indexes (when using Supabase tables): `branding_domains(domain_name)`,
 * `branding_domains(tenant_id, updated_at desc)`, `branding_themes(tenant_id, theme_key)`,
 * `branding_profiles(tenant_id, updated_at desc)`.
 */
export function mapBrandingHostToTenantId(host) {
    var _a, _b, _c;
    if (!host)
        return null;
    const base = (_b = (_a = host.split(":")[0]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) !== null && _b !== void 0 ? _b : "";
    const raw = process.env.ZIRO_BRANDING_DOMAIN_MAP;
    if (!raw)
        return null;
    try {
        const table = JSON.parse(raw);
        return (_c = table[base]) !== null && _c !== void 0 ? _c : null;
    }
    catch (_d) {
        return null;
    }
}
/** Async wrapper for middleware (future: remote KV / edge config). */
export async function resolveTenantIdFromHost(host) {
    return mapBrandingHostToTenantId(host);
}
