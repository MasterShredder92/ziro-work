/**
 * Edge-safe stub: map hostname → tenant id via `ZIRO_BRANDING_DOMAIN_MAP`
 * (JSON object of host → tenant UUID). Production can replace with KV/DB
 * lookup outside the Edge bundle.
 *
 * Recommended DB indexes (when using Supabase tables): `branding_domains(domain_name)`,
 * `branding_domains(tenant_id, updated_at desc)`, `branding_themes(tenant_id, theme_key)`,
 * `branding_profiles(tenant_id, updated_at desc)`.
 */
export function mapBrandingHostToTenantId(host: string | null): string | null {
  if (!host) return null;
  const base = host.split(":")[0]?.trim().toLowerCase() ?? "";
  const raw = process.env.ZIRO_BRANDING_DOMAIN_MAP;
  if (!raw) return null;
  try {
    const table = JSON.parse(raw) as Record<string, string>;
    return table[base] ?? null;
  } catch {
    return null;
  }
}

/** Async wrapper for middleware (future: remote KV / edge config). */
export async function resolveTenantIdFromHost(
  host: string | null,
): Promise<string | null> {
  return mapBrandingHostToTenantId(host);
}
