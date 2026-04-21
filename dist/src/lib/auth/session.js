/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isRole, normalizeDbRole, roleAtLeast } from "./roles";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";
export const IMPERSONATE_COOKIE = "ziro_impersonate";
function getSupabaseServerEnv() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // ✅ FIXED
    if (!url || !key)
        return null;
    return { url, key };
}
function normalizeOrEmpty(value) {
    return typeof value === "string" ? value.trim() : "";
}
function pickTenantId(user) {
    var _a, _b;
    const app = (_a = user.app_metadata) !== null && _a !== void 0 ? _a : {};
    const meta = (_b = user.user_metadata) !== null && _b !== void 0 ? _b : {};
    const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
    for (const candidate of candidates) {
        const normalized = normalizeOrEmpty(candidate);
        if (normalized)
            return normalized;
    }
    return "";
}
function pickProfileId(user) {
    return normalizeOrEmpty(user.id);
}
function pickNameParts(user) {
    var _a, _b, _c, _d;
    const meta = (_a = user.user_metadata) !== null && _a !== void 0 ? _a : {};
    const first = normalizeOrEmpty((_b = meta.first_name) !== null && _b !== void 0 ? _b : meta.firstName);
    const last = normalizeOrEmpty((_c = meta.last_name) !== null && _c !== void 0 ? _c : meta.lastName);
    if (first || last) {
        return {
            firstName: first || "User",
            lastName: last || "Account",
        };
    }
    const email = normalizeOrEmpty(user.email);
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
async function resolveFirstActiveLocationId(client, tenantId) {
    if (!client || !tenantId)
        return null;
    const { data: byActive, error: byActiveError } = await client
        .from("locations")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (!byActiveError && typeof (byActive === null || byActive === void 0 ? void 0 : byActive.id) === "string" && byActive.id.trim()) {
        return byActive.id.trim();
    }
    const { data: byIsActive, error: byIsActiveError } = await client
        .from("locations")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (!byIsActiveError && typeof (byIsActive === null || byIsActive === void 0 ? void 0 : byIsActive.id) === "string" && byIsActive.id.trim()) {
        return byIsActive.id.trim();
    }
    return null;
}
async function ensureUserProfileAndLocation(client, user) {
    var _a;
    if (!client)
        return null;
    const userId = normalizeOrEmpty(user.id);
    const userEmail = normalizeOrEmpty(user.email);
    if (!userId)
        return null;
    let existing = null;
    try {
        const { data: byId } = await client
            .from("profiles")
            .select("id,email,role,tenant_id,is_platform_admin")
            .eq("id", userId)
            .maybeSingle();
        existing = byId !== null && byId !== void 0 ? byId : null;
    }
    catch (_b) {
        existing = null;
    }
    if (!existing && userEmail) {
        try {
            const { data: byEmail } = await client
                .from("profiles")
                .select("id,email,role,tenant_id,is_platform_admin")
                .eq("email", userEmail)
                .maybeSingle();
            existing = byEmail !== null && byEmail !== void 0 ? byEmail : null;
        }
        catch (_c) {
            existing = null;
        }
    }
    const metadataTenantId = pickTenantId(user) || DEFAULT_TENANT_ID;
    const resolvedTenantId = normalizeOrEmpty(existing === null || existing === void 0 ? void 0 : existing.tenant_id) || metadataTenantId || DEFAULT_TENANT_ID;
    const existingRole = normalizeDbRole((existing === null || existing === void 0 ? void 0 : existing.is_platform_admin) ? "admin" : ((_a = existing === null || existing === void 0 ? void 0 : existing.role) !== null && _a !== void 0 ? _a : null));
    const resolvedRole = existingRole !== null && existingRole !== void 0 ? existingRole : "admin";
    const names = pickNameParts(user);
    const upsertProfile = async (email) => client
        .from("profiles")
        .upsert({
        id: userId,
        email,
        tenant_id: resolvedTenantId,
        role: resolvedRole,
        first_name: names.firstName,
        last_name: names.lastName,
        is_active: true,
    }, { onConflict: "id" })
        .select("id,email,role,tenant_id,is_platform_admin")
        .maybeSingle();
    let profile = null;
    const { data: upsertedWithEmail, error: upsertWithEmailError } = await upsertProfile(userEmail || null);
    if (!upsertWithEmailError && upsertedWithEmail) {
        profile = upsertedWithEmail;
    }
    else {
        const { data: upsertedNoEmail, error: upsertNoEmailError } = await upsertProfile(null);
        if (!upsertNoEmailError && upsertedNoEmail) {
            profile = upsertedNoEmail;
        }
    }
    if (!profile) {
        try {
            const { data: byId } = await client
                .from("profiles")
                .select("id,email,role,tenant_id,is_platform_admin")
                .eq("id", userId)
                .maybeSingle();
            profile = byId !== null && byId !== void 0 ? byId : null;
        }
        catch (_d) {
            profile = null;
        }
    }
    if (!profile)
        return null;
    const profileTenantId = normalizeOrEmpty(profile.tenant_id) || resolvedTenantId || DEFAULT_TENANT_ID;
    const firstLocationId = await resolveFirstActiveLocationId(client, profileTenantId);
    if (firstLocationId) {
        await client
            .from("profile_locations")
            .upsert([{ profile_id: userId, location_id: firstLocationId }], {
            onConflict: "profile_id,location_id",
        });
    }
    return profile;
}
async function buildServerClient() {
    var _a;
    const env = getSupabaseServerEnv();
    if (!env)
        return null;
    const headerStore = await headers();
    const cookieStore = await cookies();
    const host = (_a = headerStore.get("host")) !== null && _a !== void 0 ? _a : "";
    if (host && host !== "localhost:3000") {
        console.warn(`[auth/session] non-localhost host detected: ${host}`);
    }
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map((cookie) => cookie.name);
    const accessCookiePresent = cookieNames.includes("sb-access-token") ||
        cookieNames.some((name) => /^sb-.+-access-token$/.test(name)) ||
        cookieNames.some((name) => /^sb-.+-auth-token$/.test(name));
    const refreshCookiePresent = cookieNames.includes("sb-refresh-token") ||
        cookieNames.some((name) => /^sb-.+-refresh-token$/.test(name));
    console.info(`[auth/session] accessCookiePresent=${accessCookiePresent}`);
    console.info(`[auth/session] refreshCookiePresent=${refreshCookiePresent}`);
    console.info(`[auth/session] token cookies access=${accessCookiePresent} refresh=${refreshCookiePresent}`);
    return createServerClient(env.url, env.key, {
        cookies: {
            getAll() {
                return cookieStore.getAll().map((cookie) => ({
                    name: cookie.name,
                    value: cookie.value,
                }));
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    try {
                        cookieStore.set(name, value, options);
                    }
                    catch (_a) {
                        continue;
                    }
                }
            },
        },
    });
}
async function resolveDevelopmentFallbackSession() {
    var _a, _b;
    if (process.env.NODE_ENV === "production")
        return null;
    if (process.env.ZIRO_DEV_SESSION_FALLBACK === "0")
        return null;
    try {
        const service = getServiceClient();
        const { data: profile } = await service
            .from("profiles")
            .select("id, role, tenant_id, is_platform_admin")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
        if (!(profile === null || profile === void 0 ? void 0 : profile.id))
            return null;
        const tenantId = normalizeOrEmpty(profile.tenant_id) || DEFAULT_TENANT_ID;
        const baseRole = (_b = normalizeDbRole(profile.is_platform_admin ? "admin" : ((_a = profile.role) !== null && _a !== void 0 ? _a : null))) !== null && _b !== void 0 ? _b : "admin";
        return {
            userId: profile.id,
            profileId: profile.id,
            role: baseRole,
            baseRole,
            tenantId,
            isImpersonating: false,
        };
    }
    catch (_c) {
        return null;
    }
}
export async function getSession() {
    var _a, _b, _c, _d, _e, _f;
    const client = await buildServerClient();
    if (!client)
        return null;
    const { data: { user }, error: userErr, } = await client.auth.getUser();
    if (userErr || !user) {
        return resolveDevelopmentFallbackSession();
    }
    const userId = normalizeOrEmpty(user.id);
    if (!userId)
        return null;
    let profileId = pickProfileId(user) || userId;
    let tenantId = pickTenantId(user) || DEFAULT_TENANT_ID;
    let role = (_d = normalizeDbRole((_b = (_a = user.app_metadata) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : (_c = user.user_metadata) === null || _c === void 0 ? void 0 : _c.role)) !== null && _d !== void 0 ? _d : "admin";
    const profileSelect = "id, email, role, tenant_id, is_platform_admin";
    let profile = null;
    try {
        const { data: byId } = await client
            .from("profiles")
            .select(profileSelect)
            .eq("id", userId)
            .maybeSingle();
        profile = byId !== null && byId !== void 0 ? byId : null;
    }
    catch (_g) {
        profile = null;
    }
    if (!profile && user.email) {
        try {
            const { data: byEmail } = await client
                .from("profiles")
                .select(profileSelect)
                .eq("email", user.email)
                .maybeSingle();
            profile = byEmail !== null && byEmail !== void 0 ? byEmail : null;
        }
        catch (_h) {
            profile = null;
        }
    }
    if (!profile || !normalizeOrEmpty(profile.tenant_id) || !normalizeDbRole(profile.role)) {
        const repaired = await ensureUserProfileAndLocation(client, user);
        if (repaired)
            profile = repaired;
    }
    if (profile) {
        profileId = userId;
        tenantId = normalizeOrEmpty(profile.tenant_id) || tenantId || DEFAULT_TENANT_ID;
        const rawRole = profile.is_platform_admin === true ? "admin" : profile.role;
        const profileRole = normalizeDbRole(rawRole);
        if (profileRole)
            role = profileRole;
    }
    if (!tenantId)
        tenantId = DEFAULT_TENANT_ID;
    if (!role)
        role = "admin";
    let effectiveRole = role;
    let isImpersonating = false;
    if (role === "admin" || role === "director") {
        try {
            const cookieStore = await cookies();
            const impersonated = (_f = (_e = cookieStore.get(IMPERSONATE_COOKIE)) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : null;
            if (impersonated && isRole(impersonated)) {
                const target = impersonated;
                if (!roleAtLeast(target, role)) {
                    effectiveRole = target;
                    isImpersonating = true;
                }
            }
        }
        catch (_j) {
            effectiveRole = role;
        }
    }
    return {
        userId,
        profileId,
        role: effectiveRole,
        tenantId,
        baseRole: role,
        isImpersonating,
    };
}
export async function requireSession() {
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    return session;
}
