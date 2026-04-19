import * as path from "path";
import * as dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const REAL_SCHOOLS = ["Bellevue", "Gretna", "Elkhorn", "Omaha"] as const;
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const PAGE_SIZE = 1000;

type StudentRow = {
  id: string;
  tenant_id: string;
  family_id: string | null;
  location_id: string | null;
  teacher_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type FamilyRow = {
  id: string;
  tenant_id: string;
  name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  primary_location_id: string | null;
};

type TeacherRow = {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
};

type LocationRow = {
  id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeName(first: string | null | undefined, last: string | null | undefined): string {
  return normalize(`${first ?? ""} ${last ?? ""}`);
}

function schoolFromName(value: string): (typeof REAL_SCHOOLS)[number] | null {
  const n = normalize(value);
  for (const school of REAL_SCHOOLS) {
    if (n.includes(normalize(school))) return school;
  }
  return null;
}

async function fetchAll<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await client.from(table).select(columns).range(from, to);
    if (error) throw error;
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function resolveTenantId(client: SupabaseClient): Promise<string> {
  const explicit = process.env.TARGET_TENANT_ID?.trim();
  if (explicit) return explicit;

  const rows = await fetchAll<LocationRow>(client, "locations", "id,tenant_id,name,is_active");
  const score = new Map<string, number>();
  for (const row of rows) {
    const tenantId = String(row.tenant_id ?? "").trim();
    if (!tenantId) continue;
    const weight = schoolFromName(row.name) ? 5 : 1;
    score.set(tenantId, (score.get(tenantId) ?? 0) + weight);
  }

  let best = DEFAULT_TENANT_ID;
  let bestScore = -1;
  for (const [tenantId, count] of score.entries()) {
    if (count > bestScore) {
      bestScore = count;
      best = tenantId;
    }
  }
  return best;
}

async function run() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tenantId = await resolveTenantId(client);
  const locations = await fetchAll<LocationRow>(client, "locations", "id,tenant_id,name,is_active");
  const families = await fetchAll<FamilyRow>(
    client,
    "families",
    "id,tenant_id,name,primary_email,primary_phone,primary_location_id",
  );
  const teachers = await fetchAll<TeacherRow>(
    client,
    "teachers",
    "id,tenant_id,first_name,last_name,display_name,email",
  );
  const students = await fetchAll<StudentRow>(
    client,
    "students",
    "id,tenant_id,family_id,location_id,teacher_id,first_name,last_name,email,phone",
  );

  const canonicalLocations = locations.filter(
    (row) => row.tenant_id === tenantId && schoolFromName(row.name) && row.is_active,
  );
  const locationIdSet = new Set(canonicalLocations.map((row) => row.id));
  const fallbackLocationId = canonicalLocations.find((row) => normalize(row.name) === "bellevue")?.id ??
    canonicalLocations[0]?.id ??
    null;

  if (!fallbackLocationId) {
    throw new Error("No canonical locations found. Run scripts/migrateLocationsToStudios.ts first.");
  }

  const tenantTeachers = teachers.filter((row) => row.tenant_id === tenantId);
  const teacherIdSet = new Set(tenantTeachers.map((row) => row.id));
  const teacherByNatural = new Map<string, string>();
  for (const row of teachers) {
    const keys = [
      normalize(row.email),
      normalizeName(row.first_name, row.last_name),
      normalize(row.display_name),
    ].filter(Boolean);
    for (const keyValue of keys) {
      if (!teacherByNatural.has(keyValue)) teacherByNatural.set(keyValue, row.id);
    }
  }

  const tenantFamilies = families.filter((row) => row.tenant_id === tenantId);
  const familyIdSet = new Set(tenantFamilies.map((row) => row.id));
  const familyByNatural = new Map<string, string>();
  for (const row of families) {
    const keys = [normalize(row.primary_email), normalize(row.primary_phone), normalize(row.name)].filter(Boolean);
    for (const keyValue of keys) {
      if (!familyByNatural.has(keyValue)) familyByNatural.set(keyValue, row.id);
    }
  }

  let updatedFamilies = 0;
  let updatedTeachers = 0;
  let updatedStudents = 0;
  let deletedTeacherLocations = 0;
  let insertedTeacherLocations = 0;
  let deletedProfileLocations = 0;

  for (const row of families) {
    const patch: Record<string, unknown> = {};
    if (row.tenant_id !== tenantId) patch.tenant_id = tenantId;
    if (!row.primary_location_id || !locationIdSet.has(row.primary_location_id)) {
      patch.primary_location_id = fallbackLocationId;
    }
    if (Object.keys(patch).length === 0) continue;
    const { error } = await client.from("families").update(patch).eq("id", row.id);
    if (error) throw error;
    updatedFamilies += 1;
    familyIdSet.add(row.id);
  }

  for (const row of teachers) {
    if (row.tenant_id === tenantId) continue;
    const { error } = await client.from("teachers").update({ tenant_id: tenantId }).eq("id", row.id);
    if (error) throw error;
    updatedTeachers += 1;
    teacherIdSet.add(row.id);
  }

  for (const row of students) {
    const patch: Record<string, unknown> = {};
    if (row.tenant_id !== tenantId) patch.tenant_id = tenantId;

    if (row.family_id && !familyIdSet.has(row.family_id)) {
      const mappedFamily =
        familyByNatural.get(normalize(row.email)) ??
        familyByNatural.get(normalize(row.phone)) ??
        null;
      patch.family_id = mappedFamily;
    }

    if (!row.location_id || !locationIdSet.has(row.location_id)) {
      patch.location_id = fallbackLocationId;
    }

    if (row.teacher_id && !teacherIdSet.has(row.teacher_id)) {
      const mappedTeacher =
        teacherByNatural.get(normalize(row.email)) ??
        teacherByNatural.get(normalizeName(row.first_name, row.last_name)) ??
        null;
      patch.teacher_id = mappedTeacher;
    }

    if (Object.keys(patch).length === 0) continue;
    const { error } = await client.from("students").update(patch).eq("id", row.id);
    if (error) throw error;
    updatedStudents += 1;
  }

  const { data: teacherLocationsRows, error: tlError } = await client
    .from("teacher_locations")
    .select("id,teacher_id,location_id");
  if (tlError) throw tlError;

  const teacherLocationPairs = new Set<string>();
  for (const link of teacherLocationsRows ?? []) {
    const teacherId = String(link.teacher_id ?? "");
    const locationId = String(link.location_id ?? "");
    const valid = teacherIdSet.has(teacherId) && locationIdSet.has(locationId);
    if (!valid) {
      const { error } = await client.from("teacher_locations").delete().eq("id", link.id);
      if (error) throw error;
      deletedTeacherLocations += 1;
      continue;
    }
    teacherLocationPairs.add(`${teacherId}:${locationId}`);
  }

  for (const teacherId of teacherIdSet) {
    const keyPair = `${teacherId}:${fallbackLocationId}`;
    if (teacherLocationPairs.has(keyPair)) continue;
    const { error } = await client.from("teacher_locations").insert({
      teacher_id: teacherId,
      location_id: fallbackLocationId,
    });
    if (error) throw error;
    insertedTeacherLocations += 1;
  }

  const { data: profileLocationsRows, error: plError } = await client
    .from("profile_locations")
    .select("id,location_id");
  if (plError) throw plError;

  for (const row of profileLocationsRows ?? []) {
    if (locationIdSet.has(String(row.location_id ?? ""))) continue;
    const { error } = await client.from("profile_locations").delete().eq("id", row.id);
    if (error) throw error;
    deletedProfileLocations += 1;
  }

  console.log("People reconstruction complete.");
  console.log(`Tenant: ${tenantId}`);
  console.log(`Updated families: ${updatedFamilies}`);
  console.log(`Updated teachers: ${updatedTeachers}`);
  console.log(`Updated students: ${updatedStudents}`);
  console.log(`Deleted invalid teacher_locations: ${deletedTeacherLocations}`);
  console.log(`Inserted teacher_locations fallback links: ${insertedTeacherLocations}`);
  console.log(`Deleted invalid profile_locations: ${deletedProfileLocations}`);
}

run().catch((error) => {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    try {
      console.error(JSON.stringify(error, null, 2));
    } catch {
      console.error(String(error));
    }
  }
  process.exit(1);
});
