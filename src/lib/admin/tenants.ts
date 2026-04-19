import { serviceClient } from "@data/index";
import type { Location } from "./types";

export interface AdminTenant {
  id: string;
  name: string;
}

export async function listAdminTenants(): Promise<AdminTenant[]> {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name ?? row.id),
    }));
  } catch {
    return [];
  }
}

export async function listAdminLocations(
  tenantId: string,
): Promise<Location[]> {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      tenant_id: String(row.tenant_id ?? tenantId),
      name: String(row.name ?? row.id),
      slug: (row.slug as string | null) ?? null,
      address: (row.address as string | null) ?? null,
      city: (row.city as string | null) ?? null,
      region: (row.region as string | null) ?? null,
      postal_code: (row.postal_code as string | null) ?? null,
      timezone: (row.timezone as string | null) ?? null,
      active: (row.active as boolean | undefined) ?? true,
    }));
  } catch {
    return [];
  }
}
