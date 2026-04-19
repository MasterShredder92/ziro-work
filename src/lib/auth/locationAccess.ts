import "server-only";
import type { Session } from "@/lib/auth/session";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export type AccessibleLocation = {
  id: string;
  name: string;
};

export type UserLocationAccess = {
  tenantId: string;
  profileId: string;
  locations: AccessibleLocation[];
  selectedLocationId: string | null;
};

function normalizeId(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLocationName(value: string): string {
  return value
    .trim()
    .replace(/\s+music\s+lessons\s*$/i, "")
    .replace(/\s+/g, " ");
}

function dedupeLocations(rows: AccessibleLocation[]): AccessibleLocation[] {
  const picked = new Map<string, AccessibleLocation>();
  for (const row of rows) {
    const name = normalizeLocationName(row.name || row.id);
    const key = name.toLowerCase() || row.id;
    const existing = picked.get(key);
    if (!existing) {
      picked.set(key, { id: row.id, name });
      continue;
    }
    const currentLen = normalizeLocationName(existing.name).length;
    const nextLen = name.length;
    if (nextLen < currentLen || (nextLen === currentLen && name.localeCompare(existing.name) < 0)) {
      picked.set(key, { id: row.id, name });
    }
  }
  return Array.from(picked.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeId(value)).filter((value) => value.length > 0)),
  );
}

function resolveSafeTenantId(session: Session): string {
  const tenantId = normalizeId(session.tenantId);
  return tenantId || DEFAULT_TENANT_ID;
}

function resolveSafeProfileId(session: Session): string {
  const profileId = normalizeId(session.profileId);
  const userId = normalizeId(session.userId);
  return profileId || userId;
}

function pickPreferredLocationId(
  locations: AccessibleLocation[],
  preferredLocationId?: string | null,
): string | null {
  const preferred = normalizeId(preferredLocationId);
  if (preferred && locations.some((location) => location.id === preferred)) {
    return preferred;
  }
  return locations[0]?.id ?? null;
}

function buildAccess(input: {
  tenantId: string;
  profileId: string;
  locations: AccessibleLocation[];
  preferredLocationId?: string | null;
}): UserLocationAccess {
  const locations = Array.isArray(input.locations) ? input.locations : [];
  return {
    tenantId: input.tenantId,
    profileId: input.profileId,
    locations,
    selectedLocationId: pickPreferredLocationId(locations, input.preferredLocationId),
  };
}

async function listActiveTenantLocations(tenantId: string): Promise<AccessibleLocation[]> {
  try {
    const supabase = getServiceClient();
    const { data: byIsActive } = await supabase
      .from("locations")
      .select("id,name")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    const normalizedByIsActive = (byIsActive ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name ?? row.id),
    }));

    if (normalizedByIsActive.length > 0) {
      return dedupeLocations(normalizedByIsActive);
    }

    const { data: byActive } = await supabase
      .from("locations")
      .select("id,name")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("name", { ascending: true });

    return dedupeLocations(
      (byActive ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name ?? row.id),
      })),
    );
  } catch {
    return [];
  }
}

async function listProfileLocationIds(profileId: string): Promise<string[]> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("profile_locations")
      .select("location_id")
      .eq("profile_id", profileId);
    return uniqueIds((data ?? []).map((row) => row.location_id));
  } catch {
    return [];
  }
}

async function listMembershipFilteredLocations(
  profileId: string,
  activeLocations: AccessibleLocation[],
): Promise<AccessibleLocation[]> {
  const profileLocationIds = await listProfileLocationIds(profileId);
  if (profileLocationIds.length === 0) return [];
  return activeLocations.filter((location) => profileLocationIds.includes(location.id));
}

async function ensureProfileLocation(profileId: string, locationId: string): Promise<boolean> {
  try {
    const supabase = getServiceClient();
    const { data: existing } = await supabase
      .from("profile_locations")
      .select("id")
      .eq("profile_id", profileId)
      .eq("location_id", locationId)
      .limit(1);
    if ((existing ?? []).length > 0) return true;
    const { error: insertError } = await supabase
      .from("profile_locations")
      .insert({ profile_id: profileId, location_id: locationId });
    return !insertError;
  } catch {
    return false;
  }
}

async function ensureProfileLocationWithRetry(
  profileId: string,
  locationId: string,
): Promise<boolean> {
  const first = await ensureProfileLocation(profileId, locationId);
  if (first) return true;
  return ensureProfileLocation(profileId, locationId);
}

export async function resolveUserLocationAccess(input: {
  session: Session;
  preferredLocationId?: string | null;
  autoRepairProfileLocation?: boolean;
}): Promise<UserLocationAccess> {
  const tenantId = resolveSafeTenantId(input.session);
  const profileId = resolveSafeProfileId(input.session);
  const activeLocations = await listActiveTenantLocations(tenantId);
  if (activeLocations.length === 0) {
    return buildAccess({
      tenantId,
      profileId,
      locations: [],
      preferredLocationId: input.preferredLocationId,
    });
  }

  let accessibleLocations = await listMembershipFilteredLocations(
    profileId,
    activeLocations,
  );

  if (accessibleLocations.length === 0 && input.autoRepairProfileLocation !== false) {
    const fallbackLocationId = activeLocations[0]?.id ?? "";
    if (fallbackLocationId) {
      const repaired = await ensureProfileLocationWithRetry(
        profileId,
        fallbackLocationId,
      );
      if (repaired) {
        accessibleLocations = await listMembershipFilteredLocations(
          profileId,
          activeLocations,
        );
      }
    }
  }

  if (accessibleLocations.length === 0) {
    accessibleLocations = activeLocations;
  }

  return buildAccess({
    tenantId,
    profileId,
    locations: accessibleLocations,
    preferredLocationId: input.preferredLocationId,
  });
}

export function assertLocationAllowed(
  access: Pick<UserLocationAccess, "locations" | "selectedLocationId">,
  locationId: string | null | undefined,
): string {
  const normalized = normalizeId(locationId);
  const locations = Array.isArray(access.locations) ? access.locations : [];
  if (normalized && locations.some((location) => location.id === normalized)) {
    return normalized;
  }
  return access.selectedLocationId ?? locations[0]?.id ?? "";
}
