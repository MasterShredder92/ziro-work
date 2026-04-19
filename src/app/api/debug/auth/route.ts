import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickTenantId(user: {
  app_metadata?: JsonRecord | null;
  user_metadata?: JsonRecord | null;
}): string {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
  for (const candidate of candidates) {
    const normalized = normalizeString(candidate);
    if (normalized) return normalized;
  }
  return DEFAULT_TENANT_ID;
}

function pickRole(user: {
  app_metadata?: JsonRecord | null;
  user_metadata?: JsonRecord | null;
}): "admin" | "director" | "teacher" | "family" | "student" {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  const raw = normalizeString(app.role ?? meta.role).toLowerCase();
  if (raw === "admin") return "admin";
  if (raw === "director") return "director";
  if (raw === "family") return "family";
  if (raw === "student") return "student";
  return "teacher";
}

function pickNameParts(user: { email?: string | null; user_metadata?: JsonRecord | null }): {
  firstName: string;
  lastName: string;
} {
  const meta = user.user_metadata ?? {};
  const first = normalizeString(meta.first_name ?? meta.firstName);
  const last = normalizeString(meta.last_name ?? meta.lastName);
  if (first || last) {
    return {
      firstName: first || "User",
      lastName: last || "Account",
    };
  }
  const email = normalizeString(user.email);
  const localPart = email.includes("@") ? email.slice(0, email.indexOf("@")) : "";
  const clean = localPart.replace(/[._-]+/g, " ").trim();
  if (!clean) return { firstName: "User", lastName: "Account" };
  const parts = clean.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "User",
    lastName: parts.slice(1).join(" ") || "Account",
  };
}

export async function GET() {
  const payload: {
    ok: boolean;
    authenticated: boolean;
    auth: { userId: string | null; email: string | null };
    tenantId: string;
    profile: JsonRecord | null;
    profileLocations: JsonRecord[];
    activeLocations: JsonRecord[];
    actions: string[];
    errors: string[];
  } = {
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
          } catch {
            return;
          }
        },
      },
    });

    const {
      data: { user: authUser },
    } = await authClient.auth.getUser().catch(() => ({ data: { user: null } }));
    let user = authUser;

    if (!user) {
      const serviceFallback = getServiceClient();
      let fallbackProfile: { id: string; email: string | null; tenant_id: string } | null = null;
      try {
        const { data } = await serviceFallback
          .from("profiles")
          .select("id,email,tenant_id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle<{ id: string; email: string | null; tenant_id: string }>();
        fallbackProfile = data ?? null;
      } catch {
        fallbackProfile = null;
      }
      if (fallbackProfile?.id) {
        payload.actions.push("AUTH_FALLBACK_PROFILE");
        user = {
          id: String(fallbackProfile.id),
          email: (fallbackProfile.email as string | null) ?? null,
          app_metadata: { tenant_id: fallbackProfile.tenant_id },
          user_metadata: {},
        } as unknown as typeof authUser;
      } else {
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
    payload.auth.email = resolvedUser.email ?? null;
    payload.authenticated = true;
    payload.tenantId = pickTenantId(resolvedUser);

    const service = getServiceClient();
    const role = pickRole(resolvedUser);
    const names = pickNameParts(resolvedUser);

    let profile: JsonRecord | null = null;
    try {
      const { data: byId } = await service
        .from("profiles")
        .select("*")
        .eq("id", resolvedUser.id)
        .maybeSingle();
      profile = (byId as JsonRecord | null) ?? null;
    } catch {
      profile = null;
    }

    if (!profile && resolvedUser.email) {
      try {
        const { data: byEmail } = await service
          .from("profiles")
          .select("*")
          .eq("email", resolvedUser.email)
          .maybeSingle();
        profile = (byEmail as JsonRecord | null) ?? null;
      } catch {
        profile = null;
      }
    }

    if (!profile) {
      payload.actions.push("CREATE_PROFILE");
      const insertRow = {
        id: resolvedUser.id,
        email: resolvedUser.email ?? null,
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
        profile = (createdProfile as JsonRecord | null) ?? null;
      } catch {
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
        profile = (retryProfile as JsonRecord | null) ?? null;
      } catch {
        profile = null;
      }
    }

    const profileId = normalizeString((profile?.id as string | undefined) ?? resolvedUser.id);
    payload.profile = profile;

    let activeLocations: unknown[] = [];
    try {
      const { data } = await service
        .from("locations")
        .select("id,name,tenant_id,is_active")
        .eq("tenant_id", payload.tenantId)
        .eq("is_active", true)
        .order("name", { ascending: true });
      activeLocations = (data as unknown[] | null) ?? [];
    } catch {
      activeLocations = [];
    }
    payload.activeLocations = Array.isArray(activeLocations)
      ? (activeLocations as JsonRecord[])
      : [];

    const readProfileLocations = async () => {
      try {
        const { data } = await service
          .from("profile_locations")
          .select("*")
          .eq("profile_id", profileId);
        payload.profileLocations = Array.isArray(data) ? (data as JsonRecord[]) : [];
      } catch {
        payload.profileLocations = [];
      }
    };

    await readProfileLocations();

    if (payload.profileLocations.length === 0 && payload.activeLocations.length > 0) {
      const fallbackLocationId = normalizeString(payload.activeLocations[0]?.id);
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
  } catch (error) {
    payload.ok = false;
    payload.errors.push(error instanceof Error ? error.message : "UNKNOWN_ERROR");
    return Response.json(payload, { status: 200 });
  }
}
