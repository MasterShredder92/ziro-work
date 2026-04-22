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
  console.log("[Repair] Starting POST request");
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Repair] Missing Supabase Env Vars");
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

    console.log("[Repair] Fetching user...");
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      console.error("[Repair] Auth Error:", authError);
      return Response.json({ ok: false, error: "UNAUTHENTICATED", details: authError }, { status: 401 });
    }

    const authUser = user as AuthUserLike;
    const userId = normalizeString(authUser.id);
    const userEmail = normalizeString(authUser.email);
    console.log("[Repair] User ID:", userId);

    const metadataTenantId = pickTenantId(authUser);

    // Use Service Role Client for repair operations if available
    const adminClient = supabaseServiceKey 
      ? createServerClient(supabaseUrl, supabaseServiceKey, { cookies: { getAll: () => [], setAll: () => {} } })
      : client;

    console.log("[Repair] Checking existing profile...");
    const { data: existingProfile, error: existingProfileError } = await (adminClient as any)
      .from("profiles")
      .select("id,email,tenant_id,role")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfileError) {
      console.error("[Repair] Profile Lookup Error:", existingProfileError);
      return Response.json(
        { ok: false, error: existingProfileError.message || "PROFILE_LOOKUP_FAILED" },
        { status: 500 },
      );
    }

    const resolvedTenantId =
      normalizeString(existingProfile?.tenant_id) ||
      metadataTenantId ||
      DEFAULT_TENANT_ID;
    const resolvedRole =
      normalizeRole(existingProfile?.role) ||
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

    console.log("[Repair] Upserting profile:", upsertProfileRow);
    const { data: profile, error: upsertError } = await (adminClient as any)
      .from("profiles")
      .upsert(upsertProfileRow, { onConflict: "id" })
      .select("id,email,tenant_id,role")
      .maybeSingle();

    if (upsertError) {
      console.error("[Repair] Upsert Error:", upsertError);
      return Response.json({ ok: false, error: upsertError.message }, { status: 500 });
    }

    console.log("[Repair] Checking locations for tenant:", resolvedTenantId);
    const { data: locations, error: locError } = await (adminClient as any)
      .from("locations")
      .select("id")
      .eq("tenant_id", resolvedTenantId)
      .limit(1);

    if (locError) {
      console.error("[Repair] Location Lookup Error:", locError);
      return Response.json({ ok: false, error: locError.message }, { status: 500 });
    }

    if (!locations || locations.length === 0) {
      console.warn("[Repair] No locations found for tenant");
      return Response.json({ ok: false, error: "NO_LOCATIONS_FOUND" }, { status: 400 });
    }

    const locationId = locations[0].id;
    console.log("[Repair] Linking profile to location:", locationId);
    const { error: linkError } = await (adminClient as any)
      .from("profile_locations")
      .upsert([{ profile_id: userId, location_id: locationId }], {
        onConflict: "profile_id,location_id",
      });

    if (linkError) {
      console.error("[Repair] Link Error:", linkError);
      return Response.json({ ok: false, error: linkError.message }, { status: 500 });
    }

    console.log("[Repair] Success!");
    return Response.json({ ok: true, profile, locationId }, { status: 200 });
  } catch (err: any) {
    console.error("[Repair] Global Catch:", err);
    return Response.json(
      { ok: false, error: err.message || "INTERNAL_SERVER_ERROR", stack: err.stack },
      { status: 500 }
    );
  }
}
