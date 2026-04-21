/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
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
        const tenantId = normalizeString(candidate);
        if (tenantId)
            return tenantId;
    }
    return DEFAULT_TENANT_ID;
}
function normalizeRole(value) {
    const role = normalizeString(value).toLowerCase();
    if (role === "owner" || role === "admin")
        return "admin";
    if (role === "company_director" || role === "studio_director" || role === "director") {
        return "director";
    }
    if (role === "teacher")
        return "teacher";
    if (role === "parent" || role === "family")
        return "family";
    if (role === "student")
        return "student";
    return null;
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
export async function POST(_req) {
    var _a, _b, _c, _d;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        return Response.json({ ok: false, error: "SUPABASE_ENV_MISSING" }, { status: 500 });
    }
    const cookieStore = await cookies();
    const client = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    const { data: { user }, error: authError, } = await client.auth.getUser();
    if (authError || !user) {
        return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const authUser = user;
    const userId = normalizeString(authUser.id);
    const userEmail = normalizeString(authUser.email);
    if (!userId) {
        return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }
    const metadataTenantId = pickTenantId(authUser);
    const { data: existingProfile, error: existingProfileError } = await client
        .from("profiles")
        .select("id,email,tenant_id,role")
        .eq("id", userId)
        .maybeSingle();
    if (existingProfileError) {
        return Response.json({ ok: false, error: existingProfileError.message || "PROFILE_LOOKUP_FAILED" }, { status: 500 });
    }
    let existingByEmail = null;
    if (!existingProfile && userEmail) {
        const { data: byEmail, error: byEmailError } = await client
            .from("profiles")
            .select("id,email,tenant_id,role")
            .eq("email", userEmail)
            .maybeSingle();
        if (byEmailError) {
            return Response.json({ ok: false, error: byEmailError.message || "PROFILE_LOOKUP_FAILED" }, { status: 500 });
        }
        existingByEmail = (_a = byEmail) !== null && _a !== void 0 ? _a : null;
    }
    const resolvedTenantId = normalizeString(existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.tenant_id) ||
        normalizeString(existingByEmail === null || existingByEmail === void 0 ? void 0 : existingByEmail.tenant_id) ||
        metadataTenantId ||
        DEFAULT_TENANT_ID;
    const resolvedRole = normalizeRole(existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.role) ||
        normalizeRole(existingByEmail === null || existingByEmail === void 0 ? void 0 : existingByEmail.role) ||
        normalizeRole((_c = (_b = authUser.app_metadata) === null || _b === void 0 ? void 0 : _b.role) !== null && _c !== void 0 ? _c : (_d = authUser.user_metadata) === null || _d === void 0 ? void 0 : _d.role) ||
        "admin";
    const names = pickNameParts(authUser);
    const upsertProfileRow = {
        id: userId,
        email: userEmail || null,
        tenant_id: resolvedTenantId,
        role: resolvedRole,
        first_name: names.firstName,
        last_name: names.lastName,
        is_active: true,
    };
    let profile = null;
    const { data: profileWithEmail, error: profileWithEmailError } = await client
        .from("profiles")
        .upsert(upsertProfileRow, { onConflict: "id" })
        .select("id,email,tenant_id,role")
        .maybeSingle();
    if (!profileWithEmailError && profileWithEmail) {
        profile = profileWithEmail;
    }
    else {
        const { data: profileWithoutEmail, error: profileWithoutEmailError } = await client
            .from("profiles")
            .upsert(Object.assign(Object.assign({}, upsertProfileRow), { email: null }), { onConflict: "id" })
            .select("id,email,tenant_id,role")
            .maybeSingle();
        if (profileWithoutEmailError || !profileWithoutEmail) {
            return Response.json({
                ok: false,
                error: (profileWithoutEmailError === null || profileWithoutEmailError === void 0 ? void 0 : profileWithoutEmailError.message) ||
                    (profileWithEmailError === null || profileWithEmailError === void 0 ? void 0 : profileWithEmailError.message) ||
                    "PROFILE_UPSERT_FAILED",
            }, { status: 500 });
        }
        profile = profileWithoutEmail;
    }
    const profileTenantId = normalizeString(profile.tenant_id) || resolvedTenantId;
    let firstActiveLocation = null;
    const { data: byActive, error: locationActiveError } = await client
        .from("locations")
        .select("id")
        .eq("tenant_id", profileTenantId)
        .eq("active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (!locationActiveError && (byActive === null || byActive === void 0 ? void 0 : byActive.id)) {
        firstActiveLocation = byActive;
    }
    if (!firstActiveLocation) {
        const { data: byIsActive, error: locationIsActiveError } = await client
            .from("locations")
            .select("id")
            .eq("tenant_id", profileTenantId)
            .eq("is_active", true)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
        if (locationIsActiveError) {
            return Response.json({ ok: false, error: locationIsActiveError.message || "LOCATION_LOOKUP_FAILED" }, { status: 500 });
        }
        firstActiveLocation = byIsActive !== null && byIsActive !== void 0 ? byIsActive : null;
    }
    if (!(firstActiveLocation === null || firstActiveLocation === void 0 ? void 0 : firstActiveLocation.id)) {
        const { data: fallbackLocation, error: fallbackLocationError } = await client
            .from("locations")
            .select("id,tenant_id")
            .eq("is_active", true)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();
        if (fallbackLocationError) {
            return Response.json({ ok: false, error: fallbackLocationError.message || "LOCATION_LOOKUP_FAILED" }, { status: 500 });
        }
        if ((fallbackLocation === null || fallbackLocation === void 0 ? void 0 : fallbackLocation.id) && (fallbackLocation === null || fallbackLocation === void 0 ? void 0 : fallbackLocation.tenant_id)) {
            firstActiveLocation = { id: normalizeString(fallbackLocation.id) };
            await client
                .from("profiles")
                .update({ tenant_id: normalizeString(fallbackLocation.tenant_id) })
                .eq("id", userId);
        }
        else {
            return Response.json({ ok: false, error: "NO_LOCATIONS_FOR_TENANT" }, { status: 400 });
        }
    }
    const locationId = normalizeString(firstActiveLocation.id);
    if (!locationId) {
        return Response.json({ ok: false, error: "NO_LOCATIONS_FOR_TENANT" }, { status: 400 });
    }
    const { error: profileLocationUpsertError } = await client
        .from("profile_locations")
        .upsert([{ profile_id: userId, location_id: locationId }], {
        onConflict: "profile_id,location_id",
    });
    if (profileLocationUpsertError) {
        return Response.json({ ok: false, error: profileLocationUpsertError.message || "PROFILE_LOCATION_UPSERT_FAILED" }, { status: 500 });
    }
    const { data: finalProfile, error: finalProfileError } = await client
        .from("profiles")
        .select("id,email,tenant_id,role")
        .eq("id", userId)
        .maybeSingle();
    if (finalProfileError || !finalProfile) {
        return Response.json({ ok: false, error: (finalProfileError === null || finalProfileError === void 0 ? void 0 : finalProfileError.message) || "PROFILE_FETCH_FAILED" }, { status: 500 });
    }
    return Response.json({ ok: true, profile: finalProfile, locationId }, { status: 200 });
}
