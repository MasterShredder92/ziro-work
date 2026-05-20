import "server-only";

import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import { listScheduleRooms } from "@data/scheduleRooms";
import { fetchLocationHours, type LocationHoursMap } from "@/lib/schedule/locationHours";
import type {
  Family,
  ScheduleBlock,
  Student,
  Teacher,
} from "@/lib/types/entities";
import type { Database } from "@/lib/types/supabase.generated";

export type TeacherAvailabilityRow = Database["public"]["Tables"]["teacher_availability"]["Row"];

export type WindowedScheduleData = {
  teachers: Teacher[];
  students: Student[];
  families: Family[];
  availability: TeacherAvailabilityRow[];
  blocks: ScheduleBlock[];
  rooms: Awaited<ReturnType<typeof listScheduleRooms>>;
  locationHours: LocationHoursMap;
};

export async function loadWindowedScheduleData(input: {
  tenantId: string;
  locationId: string;
  start: string;
  end: string;
  includeRooms?: boolean;
  includeStudents?: boolean;
}): Promise<WindowedScheduleData> {
  const {
    tenantId,
    locationId,
    start,
    end,
    includeRooms = false,
    includeStudents = true,
  } = input;
  assertServiceRoleAllowed("src/lib/schedule/windowedData.ts — service-role module; internal/background operations only");
  const supabase = getServiceClient();

  let locationRow: { id: string } | null = null;
  const { data: byIsActive, error: byIsActiveError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle();
  if (!byIsActiveError && byIsActive?.id) {
    locationRow = { id: byIsActive.id as string };
  }
  if (!locationRow) {
    const { data: byActive, error: byActiveError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", locationId)
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .maybeSingle();
    if (!byActiveError && byActive?.id) {
      locationRow = { id: byActive.id as string };
    }
  }
  if (!locationRow) {
    return {
      teachers: [],
      students: [],
      families: [],
      availability: [],
      blocks: [],
      rooms: [],
      locationHours: {},
    };
  }

  const teacherIdsPromise = supabase
    .from("teacher_locations")
    .select("teacher_id")
    .eq("location_id", locationId);

  const studentsPromise = includeStudents
    ? supabase
        .from("students")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("location_id", locationId)
        .is("deactivated_at", null)
        .order("first_name", { ascending: true })
        .order("last_name", { ascending: true })
        .limit(1500)
    : Promise.resolve({ data: [], error: null } as const);

  const availabilityPromise = supabase
    .from("teacher_availability")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("location_id", locationId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(2000);

  const blocksPromise = supabase
    .from("schedule_blocks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("location_id", locationId)
    .gte("block_date", start)
    .lte("block_date", end)
    .order("block_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(4000);

  const [teacherIdsRes, studentsRes, availabilityRes, blocksRes, rooms, locationHours] = await Promise.all([
    teacherIdsPromise,
    studentsPromise,
    availabilityPromise,
    blocksPromise,
    includeRooms ? listScheduleRooms(tenantId, { location_id: locationId, is_active: true }) : Promise.resolve([]),
    fetchLocationHours(locationId),
  ]);

  const teachersLocationError = teacherIdsRes.error;
  const studentsError = studentsRes.error;
  const availabilityError = availabilityRes.error;
  const blocksError = blocksRes.error;

  const teacherIds = Array.from(
    new Set(
      (teacherIdsRes.data ?? [])
        .map((row) => row.teacher_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  let students = studentsError ? [] : ((studentsRes.data ?? []) as Student[]);
  if (includeStudents && students.length === 0) {
    const fallbackStudentsRes = await supabase
      .from("students")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deactivated_at", null)
      .order("first_name", { ascending: true })
      .order("last_name", { ascending: true })
      .limit(1500);
    students = fallbackStudentsRes.error ? [] : ((fallbackStudentsRes.data ?? []) as Student[]);
  }

  const familyIds =
    students.length > 0
      ? Array.from(
          new Set(
            students
              .map((student) => student.family_id)
              .filter((id): id is string => typeof id === "string" && id.length > 0),
          ),
        )
      : [];

  const teachersPromise =
    teacherIds.length > 0
      ? supabase
          .from("teachers")
          .select("*")
          .eq("tenant_id", tenantId)
          .in("id", teacherIds)
          .eq("is_active", true)
          .order("first_name", { ascending: true })
          .order("last_name", { ascending: true })
      : supabase
          .from("teachers")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .order("first_name", { ascending: true })
          .order("last_name", { ascending: true })
          .limit(1500);

  const familiesPromise =
    familyIds.length > 0
      ? supabase
          .from("families")
          .select("*")
          .eq("tenant_id", tenantId)
          .in("id", familyIds)
          .limit(1500)
      : Promise.resolve({ data: [] as unknown[], error: null } as const);

  const [teachersRes, familiesRes] = await Promise.all([teachersPromise, familiesPromise]);

  let teachers: Teacher[] = [];
  if (teachersRes.error) {
    teachers = [];
  } else {
    teachers = (teachersRes.data ?? []) as Teacher[];
  }

  const families: Family[] = familiesRes.error ? [] : ((familiesRes.data ?? []) as Family[]);

  if (teachersLocationError || availabilityError || blocksError) {
    console.warn("[schedule/windowedData] partial fallback", {
      teacherLocationsError: teachersLocationError?.message ?? null,
      availabilityError: availabilityError?.message ?? null,
      blocksError: blocksError?.message ?? null,
      tenantId,
      locationId,
    });
  }

  return {
    teachers,
    students,
    families,
    availability: availabilityError ? [] : ((availabilityRes.data ?? []) as TeacherAvailabilityRow[]),
    blocks: blocksError ? [] : ((blocksRes.data ?? []) as ScheduleBlock[]),
    rooms,
    locationHours,
  };
}
