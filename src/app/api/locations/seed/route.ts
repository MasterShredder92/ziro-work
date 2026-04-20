/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuthUserLike = {
  id: string;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function pickTenantId(user: AuthUserLike): string {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  const candidates = [app.tenant_id, app.tenantId, meta.tenant_id, meta.tenantId];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return DEFAULT_TENANT_ID;
}

function pickProfileId(user: AuthUserLike): string {
  return user.id;
}

export async function POST() {
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
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const authUser = user as AuthUserLike;
  const tenantId = pickTenantId(authUser);
  const profileId = pickProfileId(authUser);

  const seedLocations = [
    { name: "Bellevue", code: "bellevue" },
    { name: "Gretna", code: "gretna" },
    { name: "Elkhorn", code: "elkhorn" },
    { name: "Omaha", code: "omaha" },
  ];

  const locationRows = seedLocations.map((location) => ({
    tenant_id: tenantId,
    name: location.name,
    code: location.code,
    active: true,
  }));

  const rawClient = client as any;
  const { data: upsertedLocations, error: upsertError } = await rawClient
    .from("locations")
    .upsert(locationRows, { onConflict: "tenant_id,code" })
    .select("id, tenant_id, name, code, active");

  if (upsertError) {
    return Response.json(
      { ok: false, error: upsertError.message || "FAILED_TO_SEED_LOCATIONS" },
      { status: 500 },
    );
  }

  const normalizedLocations = Array.isArray(upsertedLocations)
    ? upsertedLocations
    : [];

  if (normalizedLocations.length > 0) {
    const firstLocationId =
      typeof normalizedLocations[0]?.id === "string" ? normalizedLocations[0].id : null;

    if (firstLocationId) {
      const { data: existingLinks, error: linksError } = await rawClient
        .from("profile_locations")
        .select("id")
        .eq("profile_id", profileId)
        .limit(1);

      if (!linksError && (!Array.isArray(existingLinks) || existingLinks.length === 0)) {
        await rawClient
          .from("profile_locations")
          .upsert(
            [{ profile_id: profileId, location_id: firstLocationId }],
            { onConflict: "profile_id,location_id" },
          );
      }
    }
  }

  return Response.json({ ok: true, locations: normalizedLocations }, { status: 200 });
}
