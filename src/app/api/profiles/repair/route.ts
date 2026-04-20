/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

type AuthUserLike = {
  id: string;
  email?: string | null;
  app_metadata?: JsonRecord | null;
  user_metadata?: JsonRecord | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  tenant_id: string | null;
  role: string | null;
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickTenantId(user: AuthUserLike): string {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
  for (const candidate of candidates) {
    const tenantId = normalizeString(candidate);
    if (tenantId) return tenantId;
  }
  return DEFAULT_TENANT_ID;
}

function normalizeRole(value: unknown): "admin" | "director" | "teacher" | "family" | "student" | null {
  const role = normalizeString(value).toLowerCase();
  if (role === "owner" || role === "admin") return "admin";
  if (role === "company_director" || role === "studio_director" || role === "director") {
    return "director";
  }
  if (role === "teacher") return "teacher";
  if (role === "parent" || role === "family") return "family";
  if (role === "student") return "student";
  return null;
}

function pickNameParts(user: AuthUserLike): { firstName: string; lastName: string } {
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

export async function POST(_req: Request) {
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
          } catch {
            continue;
          }
        }
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const authUser = user as AuthUserLike;
  const userId = normalizeString(authUser.id);
  const userEmail = normalizeString(authUser.email);
  if (!userId) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const metadataTenantId = pickTenantId(authUser);

  await (client as any)
    .from("profiles")
    .select("id,email,tenant_id,role")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfileError) {
    return Response.json(
      { ok: false, error: existingProfileError.message || "PROFILE_LOOKUP_FAILED" },
      { status: 500 },
    );
  }

  let existingByEmail: ProfileRow | null = null;
  if (!existingProfile && userEmail) {
  await (client as any)
      .from("profiles")
      .select("id,email,tenant_id,role")
      .eq("email", userEmail)
      .maybeSingle();
    if (byEmailError) {
      return Response.json(
        { ok: false, error: byEmailError.message || "PROFILE_LOOKUP_FAILED" },
        { status: 500 },
      );
    }
    existingByEmail = (byEmail as ProfileRow | null) ?? null;
  }

  const resolvedTenantId =
    normalizeString(existingProfile?.tenant_id) ||
    normalizeString(existingByEmail?.tenant_id) ||
    metadataTenantId ||
    DEFAULT_TENANT_ID;
  const resolvedRole =
    normalizeRole(existingProfile?.role) ||
    normalizeRole(existingByEmail?.role) ||
    normalizeRole(authUser.app_metadata?.role ?? authUser.user_metadata?.role) ||
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

  let profile: ProfileRow | null = null;
  await (client as any)
    .from("profiles")
    .upsert(upsertProfileRow, { onConflict: "id" })
    .select("id,email,tenant_id,role")
    .maybeSingle();

  if (!profileWithEmailError && profileWithEmail) {
    profile = profileWithEmail as ProfileRow;
  } else {
  await (client as any)
      .from("profiles")
      .upsert({ ...upsertProfileRow, email: null }, { onConflict: "id" })
      .select("id,email,tenant_id,role")
      .maybeSingle();
    if (profileWithoutEmailError || !profileWithoutEmail) {
      return Response.json(
        {
          ok: false,
          error:
            profileWithoutEmailError?.message ||
            profileWithEmailError?.message ||
            "PROFILE_UPSERT_FAILED",
        },
        { status: 500 },
      );
    }
    profile = profileWithoutEmail as ProfileRow;
  }

  const profileTenantId = normalizeString(profile.tenant_id) || resolvedTenantId;

  let firstActiveLocation:
    | {
        id: string;
      }
    | null = null;

  await (client as any)
    .from("locations")
    .select("id")
    .eq("tenant_id", profileTenantId)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!locationActiveError && byActive?.id) {
    firstActiveLocation = byActive;
  }

  if (!firstActiveLocation) {
  await (client as any)
      .from("locations")
      .select("id")
      .eq("tenant_id", profileTenantId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (locationIsActiveError) {
      return Response.json(
        { ok: false, error: locationIsActiveError.message || "LOCATION_LOOKUP_FAILED" },
        { status: 500 },
      );
    }

    firstActiveLocation = byIsActive ?? null;
  }

  if (!firstActiveLocation?.id) {
  await (client as any)
      .from("locations")
      .select("id,tenant_id")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackLocationError) {
      return Response.json(
        { ok: false, error: fallbackLocationError.message || "LOCATION_LOOKUP_FAILED" },
        { status: 500 },
      );
    }

    if (fallbackLocation?.id && fallbackLocation?.tenant_id) {
      firstActiveLocation = { id: normalizeString(fallbackLocation.id) };
  await (client as any)
        .from("profiles")
        .update({ tenant_id: normalizeString(fallbackLocation.tenant_id) })
        .eq("id", userId);
    } else {
      return Response.json({ ok: false, error: "NO_LOCATIONS_FOR_TENANT" }, { status: 400 });
    }
  }

  const locationId = normalizeString(firstActiveLocation.id);
  if (!locationId) {
    return Response.json({ ok: false, error: "NO_LOCATIONS_FOR_TENANT" }, { status: 400 });
  }

  await (client as any)
    .from("profile_locations")
    .upsert([{ profile_id: userId, location_id: locationId }], {
      onConflict: "profile_id,location_id",
    });

  if (profileLocationUpsertError) {
    return Response.json(
      { ok: false, error: profileLocationUpsertError.message || "PROFILE_LOCATION_UPSERT_FAILED" },
      { status: 500 },
    );
  }

  await (client as any)
    .from("profiles")
    .select("id,email,tenant_id,role")
    .eq("id", userId)
    .maybeSingle();

  if (finalProfileError || !finalProfile) {
    return Response.json(
      { ok: false, error: finalProfileError?.message || "PROFILE_FETCH_FAILED" },
      { status: 500 },
    );
  }

  return Response.json({ ok: true, profile: finalProfile, locationId }, { status: 200 });
}
