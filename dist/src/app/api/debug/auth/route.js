import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
}
function pickTenantId(user) {
    var _a, _b;
    const app = (_a = user.app_metadata) !== null && _a !== void 0 ? _a : {};
    const meta = (_b = user.user_metadata) !== null && _b !== void 0 ? _b : {};
    const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
    for (const candidate of candidates) {
        const normalized = normalizeString(candidate);
        if (normalized)
            return normalized;
    }
    return DEFAULT_TENANT_ID;
}
function pickRole(user) {
    var _a, _b, _c;
    const app = (_a = user.app_metadata) !== null && _a !== void 0 ? _a : {};
    const meta = (_b = user.user_metadata) !== null && _b !== void 0 ? _b : {};
    const raw = normalizeString((_c = app.role) !== null && _c !== void 0 ? _c : meta.role).toLowerCase();
    if (raw === "admin")
        return "admin";
    if (raw === "director")
        return "director";
    if (raw === "family")
        return "family";
    if (raw === "student")
        return "student";
    return "teacher";
}
function pickNameParts(user) {
    var _a, _b, _c, _d;
    const meta = (_a = user.user_metadata) !== null && _a !== void 0 ? _a : {};
    const first = normalizeString((_b = meta.first_name) !== null && _b !== void 0 ? _b : meta.firstName);
    const last = normalizeString((_c = meta.last_name) !== null && _c !== void 0 ? _c : meta.lastName);
    if (first || last) {
        return {
            firstName: first || "User",
            lastName: last || "Account",
        };
    }
    const email = normalizeString(user.email);
    const localPart = email.includes("@") ? email.slice(0, email.indexOf("@")) : "";
    const clean = localPart.replace(/[._-]+/g, " ").trim();
    if (!clean)
        return { firstName: "User", lastName: "Account" };
    const parts = clean.split(/\s+/).filter(Boolean);
    return {
        firstName: (_d = parts[0]) !== null && _d !== void 0 ? _d : "User",
        lastName: parts.slice(1).join(" ") || "Account",
    };
}
export async function GET() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const payload = {
        ok: true,
        authenticated: false,
        auth: { userId: null, email: null },
        tenantId: DEFAULT_TENANT_ID,
        profile: null,
        profileLocations: [],
        activeLocations: [],
        actions: [],
        errors: [],
    };
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            payload.errors.push("SUPABASE_ENV_MISSING");
            return Response.json(payload, { status: 200 });
        }
        const cookieStore = await cookies();
        const authClient = createServerClient(supabaseUrl, supabaseKey, {
            cookies: {
                getAll() {
                    return cookieStore.getAll().map((cookie) => ({
                        name: cookie.name,
                        value: cookie.value,
                    }));
                },
                setAll(cookiesToSet) {
                    try {
                        for (const { name, value, options } of cookiesToSet) {
                            cookieStore.set(name, value, options);
                        }
                    }
                    catch (_a) {
                        return;
                    }
                },
            },
        });
        const { data: { user: authUser }, } = await authClient.auth.getUser().catch(() => ({ data: { user: null } }));
        let user = authUser;
        if (!user) {
            const serviceFallback = getServiceClient();
            let fallbackProfile = null;
            try {
                const { data } = await serviceFallback
                    .from("profiles")
                    .select("id,email,tenant_id")
                    .order("created_at", { ascending: true })
                    .limit(1)
                    .maybeSingle();
                fallbackProfile = data !== null && data !== void 0 ? data : null;
            }
            catch (_l) {
                fallbackProfile = null;
            }
            if (fallbackProfile === null || fallbackProfile === void 0 ? void 0 : fallbackProfile.id) {
                payload.actions.push("AUTH_FALLBACK_PROFILE");
                user = {
                    id: String(fallbackProfile.id),
                    email: (_a = fallbackProfile.email) !== null && _a !== void 0 ? _a : null,
                    app_metadata: { tenant_id: fallbackProfile.tenant_id },
                    user_metadata: {},
                };
            }
            else {
                payload.errors.push("UNAUTHENTICATED");
                return Response.json(payload, { status: 200 });
            }
        }
        const resolvedUser = user;
        if (!resolvedUser) {
            payload.errors.push("UNAUTHENTICATED");
            return Response.json(payload, { status: 200 });
        }
        payload.auth.userId = resolvedUser.id;
        payload.auth.email = (_b = resolvedUser.email) !== null && _b !== void 0 ? _b : null;
        payload.authenticated = true;
        payload.tenantId = pickTenantId(resolvedUser);
        const service = getServiceClient();
        const role = pickRole(resolvedUser);
        const names = pickNameParts(resolvedUser);
        let profile = null;
        try {
            const { data: byId } = await service
                .from("profiles")
                .select("*")
                .eq("id", resolvedUser.id)
                .maybeSingle();
            profile = (_c = byId) !== null && _c !== void 0 ? _c : null;
        }
        catch (_m) {
            profile = null;
        }
        if (!profile && resolvedUser.email) {
            try {
                const { data: byEmail } = await service
                    .from("profiles")
                    .select("*")
                    .eq("email", resolvedUser.email)
                    .maybeSingle();
                profile = (_d = byEmail) !== null && _d !== void 0 ? _d : null;
            }
            catch (_o) {
                profile = null;
            }
        }
        if (!profile) {
            payload.actions.push("CREATE_PROFILE");
            const insertRow = {
                id: resolvedUser.id,
                email: (_e = resolvedUser.email) !== null && _e !== void 0 ? _e : null,
                first_name: names.firstName,
                last_name: names.lastName,
                role,
                tenant_id: payload.tenantId,
                is_active: true,
            };
            try {
                const { data: createdProfile } = await service
                    .from("profiles")
                    .insert(insertRow)
                    .select("*")
                    .maybeSingle();
                profile = (_f = createdProfile) !== null && _f !== void 0 ? _f : null;
            }
            catch (_p) {
                profile = null;
            }
        }
        if (!profile) {
            try {
                const { data: retryProfile } = await service
                    .from("profiles")
                    .select("*")
                    .eq("id", resolvedUser.id)
                    .maybeSingle();
                profile = (_g = retryProfile) !== null && _g !== void 0 ? _g : null;
            }
            catch (_q) {
                profile = null;
            }
        }
        const profileId = normalizeString((_h = profile === null || profile === void 0 ? void 0 : profile.id) !== null && _h !== void 0 ? _h : resolvedUser.id);
        payload.profile = profile;
        let activeLocations = [];
        try {
            const { data } = await service
                .from("locations")
                .select("id,name,tenant_id,is_active")
                .eq("tenant_id", payload.tenantId)
                .eq("is_active", true)
                .order("name", { ascending: true });
            activeLocations = (_j = data) !== null && _j !== void 0 ? _j : [];
        }
        catch (_r) {
            activeLocations = [];
        }
        payload.activeLocations = Array.isArray(activeLocations)
            ? activeLocations
            : [];
        const readProfileLocations = async () => {
            try {
                const { data } = await service
                    .from("profile_locations")
                    .select("*")
                    .eq("profile_id", profileId);
                payload.profileLocations = Array.isArray(data) ? data : [];
            }
            catch (_a) {
                payload.profileLocations = [];
            }
        };
        await readProfileLocations();
        if (payload.profileLocations.length === 0 && payload.activeLocations.length > 0) {
            const fallbackLocationId = normalizeString((_k = payload.activeLocations[0]) === null || _k === void 0 ? void 0 : _k.id);
            if (fallbackLocationId) {
                payload.actions.push("CREATE_PROFILE_LOCATION");
                const tryInsert = async () => {
                    const { error } = await service.from("profile_locations").insert({
                        profile_id: profileId,
                        location_id: fallbackLocationId,
                    });
                    return !error;
                };
                const first = await tryInsert().catch(() => false);
                if (!first) {
                    payload.actions.push("RETRY_CREATE_PROFILE_LOCATION");
                    await tryInsert().catch(() => false);
                }
                await readProfileLocations();
            }
        }
        return Response.json(payload, { status: 200 });
    }
    catch (error) {
        payload.ok = false;
        payload.errors.push(error instanceof Error ? error.message : "UNKNOWN_ERROR");
        return Response.json(payload, { status: 200 });
    }
}
