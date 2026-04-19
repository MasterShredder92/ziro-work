import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export async function resolveBrandingTenantId(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<string> {
  const p = searchParams.tenantId;
  const fromParam = Array.isArray(p) ? p[0] : p;
  if (fromParam?.trim()) return fromParam.trim();
  const h = await headers();
  const fromHeader = h.get("x-tenant-id");
  if (fromHeader?.trim()) return fromHeader.trim();
  return DEFAULT_TENANT_ID;
}
