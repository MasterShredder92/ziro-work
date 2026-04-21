import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
function normalizeId(value) {
    return typeof value === "string" ? value.trim() : "";
}
function normalizeLocationName(value) {
    return value
        .trim()
        .replace(/\s+music\s+lessons\s*$/i, "")
        .replace(/\s+/g, " ");
}
function dedupeLocations(rows) {
    const picked = new Map();
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
function uniqueIds(values) {
    return Array.from(new Set(values.map((value) => normalizeId(value)).filter((value) => value.length > 0)));
}
function resolveSafeTenantId(session) {
    const tenantId = normalizeId(session.tenantId);
    return tenantId || DEFAULT_TENANT_ID;
}
function resolveSafeProfileId(session) {
    const profileId = normalizeId(session.profileId);
    const userId = normalizeId(session.userId);
    return profileId || userId;
}
function pickPreferredLocationId(locations, preferredLocationId) {
    var _a, _b;
    const preferred = normalizeId(preferredLocationId);
    if (preferred && locations.some((location) => location.id === preferred)) {
        return preferred;
    }
    return (_b = (_a = locations[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
}
function buildAccess(input) {
    const locations = Array.isArray(input.locations) ? input.locations : [];
    return {
        tenantId: input.tenantId,
        profileId: input.profileId,
        locations,
        selectedLocationId: pickPreferredLocationId(locations, input.preferredLocationId),
    };
}
async function listActiveTenantLocations(tenantId) {
    try {
        const supabase = getServiceClient();
        const { data: byIsActive } = await supabase
            .from("locations")
            .select("id,name")
            .eq("tenant_id", tenantId)
            .eq("is_active", true)
            .order("name", { ascending: true });
        const normalizedByIsActive = (byIsActive !== null && byIsActive !== void 0 ? byIsActive : []).map((row) => {
            var _a;
            return ({
                id: String(row.id),
                name: String((_a = row.name) !== null && _a !== void 0 ? _a : row.id),
            });
        });
        if (normalizedByIsActive.length > 0) {
            return dedupeLocations(normalizedByIsActive);
        }
        const { data: byActive } = await supabase
            .from("locations")
            .select("id,name")
            .eq("tenant_id", tenantId)
            .eq("active", true)
            .order("name", { ascending: true });
        return dedupeLocations((byActive !== null && byActive !== void 0 ? byActive : []).map((row) => {
            var _a;
            return ({
                id: String(row.id),
                name: String((_a = row.name) !== null && _a !== void 0 ? _a : row.id),
            });
        }));
    }
    catch (_a) {
        return [];
    }
}
async function listProfileLocationIds(profileId) {
    try {
        const supabase = getServiceClient();
        const { data } = await supabase
            .from("profile_locations")
            .select("location_id")
            .eq("profile_id", profileId);
        return uniqueIds((data !== null && data !== void 0 ? data : []).map((row) => row.location_id));
    }
    catch (_a) {
        return [];
    }
}
async function listMembershipFilteredLocations(profileId, activeLocations) {
    const profileLocationIds = await listProfileLocationIds(profileId);
    if (profileLocationIds.length === 0)
        return [];
    return activeLocations.filter((location) => profileLocationIds.includes(location.id));
}
async function ensureProfileLocation(profileId, locationId) {
    try {
        const supabase = getServiceClient();
        const { data: existing } = await supabase
            .from("profile_locations")
            .select("id")
            .eq("profile_id", profileId)
            .eq("location_id", locationId)
            .limit(1);
        if ((existing !== null && existing !== void 0 ? existing : []).length > 0)
            return true;
        const { error: insertError } = await supabase
            .from("profile_locations")
            .insert({ profile_id: profileId, location_id: locationId });
        return !insertError;
    }
    catch (_a) {
        return false;
    }
}
async function ensureProfileLocationWithRetry(profileId, locationId) {
    const first = await ensureProfileLocation(profileId, locationId);
    if (first)
        return true;
    return ensureProfileLocation(profileId, locationId);
}
export async function resolveUserLocationAccess(input) {
    var _a, _b;
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
    let accessibleLocations = await listMembershipFilteredLocations(profileId, activeLocations);
    if (accessibleLocations.length === 0 && input.autoRepairProfileLocation !== false) {
        const fallbackLocationId = (_b = (_a = activeLocations[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "";
        if (fallbackLocationId) {
            const repaired = await ensureProfileLocationWithRetry(profileId, fallbackLocationId);
            if (repaired) {
                accessibleLocations = await listMembershipFilteredLocations(profileId, activeLocations);
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
export function assertLocationAllowed(access, locationId) {
    var _a, _b, _c;
    const normalized = normalizeId(locationId);
    const locations = Array.isArray(access.locations) ? access.locations : [];
    if (normalized && locations.some((location) => location.id === normalized)) {
        return normalized;
    }
    return (_c = (_a = access.selectedLocationId) !== null && _a !== void 0 ? _a : (_b = locations[0]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : "";
}
