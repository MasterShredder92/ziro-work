/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isRole, normalizeDbRole, roleAtLeast, type Role } from "./roles";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";

export const IMPERSONATE_COOKIE = "ziro_impersonate";

export type Session = {
  userId: string;
  profileId: string;
  role: Role;
  tenantId: string;
  baseRole?: Role;
  isImpersonating?: boolean;
};

type ProfileRoleRow = {
  id: string;
  email?: string | null;
  role: string | null;
  tenant_id: string | null;
  is_platform_admin: boolean | null;
};

function getSupabaseServerEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // ✅ FIXED
  if (!url || !key) return null;
  return { url, key };
}

function normalizeOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickTenantId(user: {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
  for (const candidate of candidates) {
    const normalized = normalizeOrEmpty(candidate);
    if (normalized) return normalized;
  }
  return "";
}

function pickProfileId(user: {
  id: string;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  return normalizeOrEmpty(user.id);
}

function pickNameParts(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): {
  firstName: string;
  lastName: string;
} {
  const meta = user.user_metadata ?? {};
  const first = normalizeOrEmpty(meta.first_name ?? meta.firstName);
  const last = normalizeOrEmpty(meta.last_name ?? meta.lastName);
  if (first || last) {
    return {
      firstName: first || "User",
      lastName: last || "Account",
    };
  }
  const email = normalizeOrEmpty(user.email);
  const localPart = email.includes("@") ? email.slice(0, email.indexOf("@")) : "";
  const clean = localPart.replace(/[._-]+/g, " ").trim();
  if (!clean) return { firstName: "User", lastName: "Account" };
  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "User",
    lastName: parts.slice(1).join(" ") || "Account",
  };
}

async function resolveFirstActiveLocationId(
  client: Awaited<ReturnType<typeof buildServerClient>>,
  tenantId: string,
): Promise<string | null> {
  if (!client || !tenantId) return null;

  const { data: byActive, error: byActiveError } = await (client as any)
    .from("locations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!byActiveError && typeof byActive?.id === "string" && byActive.id.trim()) {
    return byActive.id.trim();
  }

  const { data: byIsActive, error: byIsActiveError } = await (client as any)
    .from("locations")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!byIsActiveError && typeof byIsActive?.id === "string" && byIsActive.id.trim()) {
    return byIsActive.id.trim();
  }

  return null;
}

async function ensureUserProfileAndLocation(
  client: Awaited<ReturnType<typeof buildServerClient>>,
  user: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
    user_metadata?: Record<string, unknown> | null;
  },
): Promise<ProfileRoleRow | null> {
  if (!client) return null;

  const userId = normalizeOrEmpty(user.id);
  const userEmail = normalizeOrEmpty(user.email);
  if (!userId) return null;

  let existing: ProfileRoleRow | null = null;
  try {
    const { data: byId } = await client
      .from("profiles")
      .select("id,email,role,tenant_id,is_platform_admin")
      .eq("id", userId)
      .maybeSingle<ProfileRoleRow>();
    existing = byId ?? null;
  } catch {
    existing = null;
  }

  if (!existing && userEmail) {
    try {
      const { data: byEmail } = await client
        .from("profiles")
        .select("id,email,role,tenant_id,is_platform_admin")
        .eq("email", userEmail)
        .maybeSingle<ProfileRoleRow>();
      existing = byEmail ?? null;
    } catch {
      existing = null;
    }
  }

  const metadataTenantId = pickTenantId(user) || DEFAULT_TENANT_ID;
  const resolvedTenantId =
    normalizeOrEmpty(existing?.tenant_id) || metadataTenantId || DEFAULT_TENANT_ID;
  const existingRole = normalizeDbRole(
    existing?.is_platform_admin ? "admin" : (existing?.role ?? null),
  );
  const resolvedRole = existingRole ?? "admin";
  const names = pickNameParts(user);

  const upsertProfile = async (email: string | null) =>
    (client as any)
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          tenant_id: resolvedTenantId,
          role: resolvedRole,
          first_name: names.firstName,
          last_name: names.lastName,
          is_active: true,
        },
        { onConflict: "id" },
      )
      .select("id,email,role,tenant_id,is_platform_admin")
      .maybeSingle();

  let profile: ProfileRoleRow | null = null;
  const { data: upsertedWithEmail, error: upsertWithEmailError } = await upsertProfile(
    userEmail || null,
  );
  if (!upsertWithEmailError && upsertedWithEmail) {
    profile = upsertedWithEmail as ProfileRoleRow;
  } else {
    const { data: upsertedNoEmail, error: upsertNoEmailError } = await upsertProfile(null);
    if (!upsertNoEmailError && upsertedNoEmail) {
      profile = upsertedNoEmail as ProfileRoleRow;
    }
  }

  if (!profile) {
    try {
      const { data: byId } = await client
        .from("profiles")
        .select("id,email,role,tenant_id,is_platform_admin")
        .eq("id", userId)
        .maybeSingle<ProfileRoleRow>();
      profile = byId ?? null;
    } catch {
      profile = null;
    }
  }

  if (!profile) return null;

  const profileTenantId =
    normalizeOrEmpty(profile.tenant_id) || resolvedTenantId || DEFAULT_TENANT_ID;
  const firstLocationId = await resolveFirstActiveLocationId(client, profileTenantId);
  if (firstLocationId) {
    await (client as any)
      .from("profile_locations")
      .upsert([{ profile_id: userId, location_id: firstLocationId }], {
        onConflict: "profile_id,location_id",
      });
  }

  return profile;
}

async function buildServerClient() {
  const env = getSupabaseServerEnv();
  if (!env) return null;

  const headerStore = await headers();
  const cookieStore = await cookies();
  const host = headerStore.get("host") ?? "";
  if (host && host !== "localhost:3000") {
    console.warn(`[auth/session] non-localhost host detected: ${host}`);
  }

  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map((cookie) => cookie.name);
  const accessCookiePresent =
    cookieNames.includes("sb-access-token") ||
    cookieNames.some((name) => /^sb-.+-access-token$/.test(name)) ||
    cookieNames.some((name) => /^sb-.+-auth-token$/.test(name));
  const refreshCookiePresent =
    cookieNames.includes("sb-refresh-token") ||
    cookieNames.some((name) => /^sb-.+-refresh-token$/.test(name));
  console.info(`[auth/session] accessCookiePresent=${accessCookiePresent}`);
  console.info(`[auth/session] refreshCookiePresent=${refreshCookiePresent}`);
  console.info(
    `[auth/session] token cookies access=${accessCookiePresent} refresh=${refreshCookiePresent}`,
  );

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
          } catch {
            continue;
          }
        }
      },
    },
  });
}

async function resolveDevelopmentFallbackSession(): Promise<Session | null> {
  // Allow fallback in all environments — when no Supabase auth cookie is present
  // (e.g. custom login flow), fall back to the first admin profile via service client.
  if (process.env.ZIRO_SESSION_FALLBACK === "0") return null;
  try {
    const service = getServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("id, role, tenant_id, is_platform_admin")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<ProfileRoleRow>();
    if (!profile?.id) return null;
    const tenantId = normalizeOrEmpty(profile.tenant_id) || DEFAULT_TENANT_ID;
    const baseRole = normalizeDbRole(
      profile.is_platform_admin ? "admin" : (profile.role ?? null),
    ) ?? "admin";
    return {
      userId: profile.id,
      profileId: profile.id,
      role: baseRole,
      baseRole,
      tenantId,
      isImpersonating: false,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const client = await buildServerClient();
  if (!client) return null;

  const {
    data: { user },
    error: userErr,
  } = await client.auth.getUser();
  if (userErr || !user) {
    return resolveDevelopmentFallbackSession();
  }

  const userId = normalizeOrEmpty(user.id);
  if (!userId) return null;

  let profileId = pickProfileId(user) || userId;
  let tenantId = pickTenantId(user) || DEFAULT_TENANT_ID;
  let role =
    normalizeDbRole(
    (user.app_metadata?.role as string | null) ??
      (user.user_metadata?.role as string | null),
    ) ?? "admin";

  const profileSelect = "id, email, role, tenant_id, is_platform_admin";
  let profile: ProfileRoleRow | null = null;

  try {
    const { data: byId } = await client
      .from("profiles")
      .select(profileSelect)
      .eq("id", userId)
      .maybeSingle<ProfileRoleRow>();
    profile = byId ?? null;
  } catch {
    profile = null;
  }

  if (!profile && user.email) {
    try {
      const { data: byEmail } = await client
        .from("profiles")
        .select(profileSelect)
        .eq("email", user.email)
        .maybeSingle<ProfileRoleRow>();
      profile = byEmail ?? null;
    } catch {
      profile = null;
    }
  }

  if (!profile || !normalizeOrEmpty(profile.tenant_id) || !normalizeDbRole(profile.role)) {
    const repaired = await ensureUserProfileAndLocation(client, user);
    if (repaired) profile = repaired;
  }

  if (profile) {
    profileId = userId;
    tenantId = normalizeOrEmpty(profile.tenant_id) || tenantId || DEFAULT_TENANT_ID;
    const rawRole = profile.is_platform_admin === true ? "admin" : profile.role;
    const profileRole = normalizeDbRole(rawRole);
    if (profileRole) role = profileRole;
  }

  if (!tenantId) tenantId = DEFAULT_TENANT_ID;
  if (!role) role = "admin";

  let effectiveRole: Role = role;
  let isImpersonating = false;

  if (role === "admin" || role === "director") {
    try {
      const cookieStore = await cookies();
      const impersonated = cookieStore.get(IMPERSONATE_COOKIE)?.value ?? null;
      if (impersonated && isRole(impersonated)) {
        const target = impersonated as Role;
        if (!roleAtLeast(target, role)) {
          effectiveRole = target;
          isImpersonating = true;
        }
      }
    } catch {
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

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
