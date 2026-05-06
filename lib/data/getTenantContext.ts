type TenantContextInput = { tenantId?: string };

function normalizeTenantId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

async function readTenantIdFromHeaders(): Promise<string | null> {
  // Only works in Next.js server contexts; safe no-op elsewhere.
  if (typeof window !== "undefined") return null;
  try {
    const mod = (await import("next/headers")) as unknown as {
      headers: () => { get: (key: string) => string | null };
    };
    return normalizeTenantId(mod.headers().get("x-tenant-id"));
  } catch {
    return null;
  }
}

function readTenantIdFromUrl(): string | null {
  try {
    const loc = (globalThis as unknown as { location?: { href?: string; search?: string } })
      .location;

    const href =
      typeof loc?.href === "string"
        ? loc.href
        : typeof loc?.search === "string"
          ? `http://local${loc.search}`
          : null;

    if (!href) return null;
    const url = new URL(href);
    return normalizeTenantId(url.searchParams.get("tenantId"));
  } catch {
    return null;
  }
}

export async function getTenantContext(
  input?: TenantContextInput
): Promise<{ tenantId: string | null }> {
  const fromInput = normalizeTenantId(input?.tenantId);
  if (fromInput) return { tenantId: fromInput };

  const fromHeaders = await readTenantIdFromHeaders();
  if (fromHeaders) return { tenantId: fromHeaders };

  const fromUrl = readTenantIdFromUrl();
  if (fromUrl) return { tenantId: fromUrl };

  return { tenantId: null };
}

