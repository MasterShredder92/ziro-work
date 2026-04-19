import type {
  Location,
  LocationInsert,
  LocationUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "locations";

export type LocationFilter = {
  is_active?: boolean;
  state?: string;
  city?: string;
  search?: string;
  ids?: string[];
};

export async function listLocations(
  tenantId: string,
  filter?: LocationFilter,
  opts?: ListOptions,
): Promise<Location[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (typeof filter?.is_active === "boolean")
    query = query.eq("is_active", filter.is_active);
  if (filter?.state) query = query.eq("state", filter.state);
  if (filter?.city) query = query.eq("city", filter.city);
  if (filter?.ids && filter.ids.length > 0) query = query.in("id", filter.ids);
  if (filter?.search && filter.search.trim().length > 0) {
    const s = filter.search.trim();
    query = query.or(
      [
        `name.ilike.%${s}%`,
        `city.ilike.%${s}%`,
        `address.ilike.%${s}%`,
      ].join(","),
    );
  }

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "name",
    ascending: opts?.ascending ?? true,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as Location[];
}

export async function getLocationById(
  id: string,
  tenantId: string,
): Promise<Location | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Location | null;
}

export async function createLocation(
  tenantId: string,
  input: Omit<LocationInsert, "tenant_id">,
): Promise<Location> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Location;
}

export async function updateLocation(
  id: string,
  tenantId: string,
  input: LocationUpdate,
): Promise<Location> {
  const supabase = clientFor(tenantId);
  const patch = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Location;
}
