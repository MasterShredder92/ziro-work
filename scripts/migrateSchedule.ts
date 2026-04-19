import * as path from "path";
import * as dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const REAL_SCHOOLS = ["Bellevue", "Gretna", "Elkhorn", "Omaha"] as const;
const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const PAGE_SIZE = 1000;

type ScheduleBlockRow = {
  id: string;
  tenant_id: string;
  location_id: string;
  teacher_id: string;
  student_id: string | null;
  room_id: string | null;
  original_teacher_id: string | null;
  original_teacher_name: string | null;
};

type LocationRow = {
  id: string;
  tenant_id: string;
  name: string;
  is_active: boolean;
};

type TeacherRow = {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
};

type StudentRow = {
  id: string;
  tenant_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type RoomRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
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

  const [scheduleBlocks, locations, teachers, students, rooms] = await Promise.all([
    fetchAll<ScheduleBlockRow>(
      client,
      "schedule_blocks",
      "id,tenant_id,location_id,teacher_id,student_id,room_id,original_teacher_id,original_teacher_name",
    ),
    fetchAll<LocationRow>(client, "locations", "id,tenant_id,name,is_active"),
    fetchAll<TeacherRow>(
      client,
      "teachers",
      "id,tenant_id,first_name,last_name,display_name,email",
    ),
    fetchAll<StudentRow>(client, "students", "id,tenant_id,first_name,last_name,email,phone"),
    fetchAll<RoomRow>(client, "rooms", "id,tenant_id,location_id"),
  ]);

  const canonicalLocations = locations.filter(
    (row) => row.tenant_id === tenantId && row.is_active && schoolFromName(row.name),
  );
  const locationIdSet = new Set(canonicalLocations.map((row) => row.id));
  const fallbackLocationId = canonicalLocations.find((row) => normalize(row.name) === "bellevue")?.id ??
    canonicalLocations[0]?.id ??
    null;

  if (!fallbackLocationId) {
    throw new Error("No canonical locations found. Run scripts/migrateLocationsToStudios.ts first.");
  }

  const teacherIdSet = new Set(teachers.filter((t) => t.tenant_id === tenantId).map((t) => t.id));
  const studentIdSet = new Set(students.filter((s) => s.tenant_id === tenantId).map((s) => s.id));
  const roomIdSet = new Set(
    rooms
      .filter((room) => room.tenant_id === tenantId && (!room.location_id || locationIdSet.has(room.location_id)))
      .map((room) => room.id),
  );

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

  const studentByNatural = new Map<string, string>();
  for (const row of students) {
    const keys = [
      normalize(row.email),
      normalize(row.phone),
      normalizeName(row.first_name, row.last_name),
    ].filter(Boolean);
    for (const keyValue of keys) {
      if (!studentByNatural.has(keyValue)) studentByNatural.set(keyValue, row.id);
    }
  }

  const firstTeacherId = teacherIdSet.values().next().value ?? null;
  if (!firstTeacherId) {
    throw new Error("No teachers available for schedule mapping.");
  }

  const locationById = new Map(locations.map((row) => [row.id, row]));
  const canonicalLocationBySchool = new Map<(typeof REAL_SCHOOLS)[number], string>();
  for (const row of canonicalLocations) {
    const school = schoolFromName(row.name);
    if (school && !canonicalLocationBySchool.has(school)) {
      canonicalLocationBySchool.set(school, row.id);
    }
  }

  let updatedBlocks = 0;
  let remappedTeachers = 0;
  let remappedStudents = 0;
  let remappedLocations = 0;
  let nulledRooms = 0;
  let fixedTenants = 0;

  for (const row of scheduleBlocks) {
    const patch: Record<string, unknown> = {};

    if (row.tenant_id !== tenantId) {
      patch.tenant_id = tenantId;
      fixedTenants += 1;
    }

    let nextTeacherId = row.teacher_id;
    if (!teacherIdSet.has(nextTeacherId)) {
      const mapped =
        (row.original_teacher_id && teacherIdSet.has(row.original_teacher_id)
          ? row.original_teacher_id
          : null) ??
        teacherByNatural.get(normalize(row.original_teacher_name)) ??
        firstTeacherId;
      nextTeacherId = mapped;
      patch.teacher_id = mapped;
      remappedTeachers += 1;
    }

    if (row.student_id && !studentIdSet.has(row.student_id)) {
      const mappedStudent =
        studentByNatural.get(normalize(row.student_id)) ??
        null;
      patch.student_id = mappedStudent;
      remappedStudents += 1;
    }

    if (!locationIdSet.has(row.location_id)) {
      const sourceLocation = locationById.get(row.location_id);
      const sourceSchool = sourceLocation ? schoolFromName(sourceLocation.name) : null;
      const mappedLocation =
        (sourceSchool ? canonicalLocationBySchool.get(sourceSchool) : null) ??
        fallbackLocationId;
      patch.location_id = mappedLocation;
      remappedLocations += 1;
    }

    if (row.room_id && !roomIdSet.has(row.room_id)) {
      patch.room_id = null;
      nulledRooms += 1;
    }

    if (Object.keys(patch).length === 0) continue;
    const { error } = await client.from("schedule_blocks").update(patch).eq("id", row.id);
    if (error) throw error;
    updatedBlocks += 1;
  }

  console.log("Schedule reconstruction complete.");
  console.log(`Tenant: ${tenantId}`);
  console.log(`Total schedule blocks scanned: ${scheduleBlocks.length}`);
  console.log(`Updated blocks: ${updatedBlocks}`);
  console.log(`Teacher remaps: ${remappedTeachers}`);
  console.log(`Student remaps/nulls: ${remappedStudents}`);
  console.log(`Location remaps: ${remappedLocations}`);
  console.log(`Room nullifications: ${nulledRooms}`);
  console.log(`Tenant fixes: ${fixedTenants}`);
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
