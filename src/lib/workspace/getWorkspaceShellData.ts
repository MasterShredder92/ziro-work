import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getSession } from "@/lib/auth/session";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

export type ShellLocation = {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
};

export type WorkspaceShellData = {
  tenantId: string;
  schoolName: string;
  locations: ShellLocation[];
};

export async function getWorkspaceShellData(): Promise<WorkspaceShellData> {
  const session = await getSession().catch(() => null);
  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;
  assertServiceRoleAllowed("src/lib/workspace/getWorkspaceShellData.ts — service-role module; internal/background operations only");
  const db = getServiceClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const [{ data: tenant }, { data: brandRows }, { data: locationRows }] = await Promise.all([
    db.from("tenants").select("name").eq("id", tenantId).single(),
    db.from("brand_settings").select("studio_name, logo_circle_path, location_id").eq("tenant_id", tenantId),
    db.from("locations").select("id, name, city").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
  ]);

  const locations: ShellLocation[] = (locationRows ?? []).map((loc) => {
    const brand = (brandRows ?? []).find((b) => b.location_id === loc.id);
    const logoUrl = brand?.logo_circle_path
      ? `${supabaseUrl}/storage/v1/object/public/brand-assets/${brand.logo_circle_path}`
      : null;
    const shortName = String(loc.name ?? "")
      .replace(" Music Lessons", "")
      .replace(" Music", "");
    return { id: loc.id, name: loc.name, shortName, logoUrl };
  });

  return {
    tenantId,
    schoolName: tenant?.name ?? "Command Center",
    locations,
  };
}
