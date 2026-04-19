import * as path from "path";
import * as dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const REAL_SCHOOLS = ["Bellevue", "Gretna", "Elkhorn", "Omaha"] as const;
const DEMO_LOCATION_NAMES = ["Demo", "North Studio", "South Studio"] as const;
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

type LocationRow = {
  id: string;
  tenant_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  hours_json: Record<string, unknown> | null;
};

type FinanceLocationRow = {
  id: string;
  tenant_id: string | null;
  name: string;
  code: string | null;
  location_type: string | null;
  is_active: boolean;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function locationSlug(name: string): string {
  return normalizeName(name).replace(/\s+/g, "-");
}

function schoolFromName(value: string): (typeof REAL_SCHOOLS)[number] | null {
  const normalized = normalizeName(value);
  for (const school of REAL_SCHOOLS) {
    if (normalized.includes(normalizeName(school))) return school;
  }
  return null;
}

function pickFirstString(values: Array<string | null | undefined>, fallback: string): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return fallback;
}

async function resolveTenantId(client: SupabaseClient): Promise<string> {
  const explicit = process.env.TARGET_TENANT_ID?.trim();
  if (explicit) return explicit;

  const { data, error } = await client.from("locations").select("tenant_id,name");
  if (error) throw error;

  const score = new Map<string, number>();
  for (const row of data ?? []) {
    const tenantId = String(row.tenant_id ?? "").trim();
    const name = String(row.name ?? "");
    if (!tenantId) continue;
    const school = schoolFromName(name);
    const weight = school ? 5 : 1;
    score.set(tenantId, (score.get(tenantId) ?? 0) + weight);
  }

  let bestTenant = DEFAULT_TENANT_ID;
  let bestScore = -1;
  for (const [tenantId, count] of score.entries()) {
    if (count > bestScore) {
      bestScore = count;
      bestTenant = tenantId;
    }
  }
  return bestTenant;
}

async function loadLocations(client: SupabaseClient): Promise<LocationRow[]> {
  const { data, error } = await client
    .from("locations")
    .select("id,tenant_id,name,address,city,state,zip,phone,email,website,is_active,hours_json");
  if (error) throw error;
  return (data ?? []) as LocationRow[];
}

async function loadFinanceLocations(client: SupabaseClient): Promise<FinanceLocationRow[]> {
  const { data, error } = await client
    .from("finance_locations")
    .select("id,tenant_id,name,code,location_type,is_active");
  if (error) throw error;
  return (data ?? []) as FinanceLocationRow[];
}

async function run() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(url, serviceKey, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tenantId = await resolveTenantId(client);
  const allLocations = await loadLocations(client);
  const financeLocations = await loadFinanceLocations(client);

  const tenantLocations = allLocations.filter((row) => row.tenant_id === tenantId);
  const financeBySchool = new Map<(typeof REAL_SCHOOLS)[number], FinanceLocationRow>();
  for (const row of financeLocations) {
    const school = schoolFromName(row.name);
    if (!school) continue;
    if (!financeBySchool.has(school)) financeBySchool.set(school, row);
  }

  const baseLocation =
    tenantLocations.find((row) => !DEMO_LOCATION_NAMES.includes(row.name as never)) ??
    tenantLocations[0] ??
    null;

  let inserted = 0;
  let updated = 0;
  const canonicalIdBySchool = new Map<(typeof REAL_SCHOOLS)[number], string>();

  for (const school of REAL_SCHOOLS) {
    const matchedExact =
      tenantLocations.find((row) => normalizeName(row.name) === normalizeName(school)) ?? null;
    const matchedFuzzy =
      tenantLocations.find((row) => schoolFromName(row.name) === school) ?? null;
    const matched = matchedExact ?? matchedFuzzy;
    const finance = financeBySchool.get(school) ?? null;

    const payload = {
      tenant_id: tenantId,
      name: school,
      address: pickFirstString([matched?.address, baseLocation?.address], `${school} Campus`),
      city: pickFirstString([matched?.city, baseLocation?.city], school),
      state: pickFirstString([matched?.state, baseLocation?.state], "NE"),
      zip: pickFirstString([matched?.zip, baseLocation?.zip], "68000"),
      phone: pickFirstString([matched?.phone, baseLocation?.phone], ""),
      email: pickFirstString([matched?.email, baseLocation?.email], ""),
      website: pickFirstString([matched?.website, baseLocation?.website], ""),
      is_active: true,
      hours_json: {
        ...(matched?.hours_json ?? {}),
        slug: locationSlug(school),
        timezone: "America/Chicago",
        source_finance_code: finance?.code ?? null,
      },
    };

    if (matched) {
      const { error } = await client
        .from("locations")
        .update(payload)
        .eq("id", matched.id)
        .eq("tenant_id", tenantId);
      if (error) throw error;
      canonicalIdBySchool.set(school, matched.id);
      updated += 1;
      continue;
    }

    const { data: insertedRows, error } = await client
      .from("locations")
      .insert(payload)
      .select("id")
      .limit(1);
    if (error) throw error;
    const insertedId = String(insertedRows?.[0]?.id ?? "");
    if (insertedId) canonicalIdBySchool.set(school, insertedId);
    inserted += 1;
  }

  const fallbackCanonicalId =
    canonicalIdBySchool.get("Bellevue") ??
    canonicalIdBySchool.values().next().value ??
    null;

  if (fallbackCanonicalId) {
    const demoRows = tenantLocations.filter((row) =>
      DEMO_LOCATION_NAMES.some((name) => normalizeName(name) === normalizeName(row.name)),
    );
    if (demoRows.length > 0) {
      const demoIds = demoRows.map((row) => row.id);

      await client
        .from("schedule_blocks")
        .update({ location_id: fallbackCanonicalId, tenant_id: tenantId })
        .in("location_id", demoIds);
      await client
        .from("students")
        .update({ location_id: fallbackCanonicalId, tenant_id: tenantId })
        .in("location_id", demoIds);
      await client
        .from("families")
        .update({ primary_location_id: fallbackCanonicalId, tenant_id: tenantId })
        .in("primary_location_id", demoIds);
      await client.from("teacher_locations").delete().in("location_id", demoIds);
      await client.from("profile_locations").delete().in("location_id", demoIds);
      await client.from("location_hours").delete().in("location_id", demoIds);
      await client.from("locations").delete().in("id", demoIds).eq("tenant_id", tenantId);
    }
  }

  const { data: finalRows, error: finalError } = await client
    .from("locations")
    .select("id,name,tenant_id,is_active,address,city,state,zip")
    .eq("tenant_id", tenantId)
    .in("name", [...REAL_SCHOOLS])
    .order("name", { ascending: true });
  if (finalError) throw finalError;

  console.log("Location reconstruction complete.");
  console.log(`Tenant: ${tenantId}`);
  console.log(`Updated: ${updated}`);
  console.log(`Inserted: ${inserted}`);
  console.log("Canonical schools:");
  for (const row of finalRows ?? []) {
    console.log(
      `- ${String(row.name)} (${String(row.id)}) active=${String(row.is_active)} address=${String(
        row.address,
      )}, ${String(row.city)}, ${String(row.state)} ${String(row.zip)}`,
    );
  }
}

run().catch((err) => {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    try {
      console.error(JSON.stringify(err, null, 2));
    } catch {
      console.error(String(err));
    }
  }
  process.exit(1);
});
