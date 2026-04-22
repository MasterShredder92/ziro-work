/**
 * Ruby Tool Definitions — CORRECT SCHEMA
 *
 * Uses the actual ZiroWork database schema:
 * - Table: schedule_blocks
 * - Key fields: location_id, tenant_id, block_date, start_time, end_time, teacher_id, student_id, status
 * - Locations: Bellevue, Elkhorn, Gretna, Omaha
 * - Tenant: 00000000-0000-0000-0000-000000000001
 */
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

// Location name → ID map (from live DB)
const LOCATION_MAP: Record<string, string> = {
  bellevue: "f7b52dd5-12ee-437f-9c60-f8adf454ac31",
  elkhorn: "cebd97d4-c241-4de2-8ade-49e5cc0070d5",
  gretna: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638",
  omaha: "d48229c1-b70a-4d29-893e-5079887dab76",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function resolveLocationId(locationInput: string): string | null {
  if (!locationInput) return null;
  // If it's already a UUID, return it directly
  if (locationInput.includes("-") && locationInput.length > 30) return locationInput;
  // Otherwise resolve by name (strip "Music Lessons" suffix)
  const key = locationInput.toLowerCase().replace(/\s+music\s+lessons?/i, "").trim();
  return LOCATION_MAP[key] || null;
}

/**
 * read_schedule
 * Returns the schedule for a given location and date.
 * Joins teacher and student names for a human-readable response.
 */
export async function read_schedule({
  locationName,
  date,
}: {
  locationName: string;
  date: string; // YYYY-MM-DD
}) {
  const supabase = getSupabase();
  const locationId = resolveLocationId(locationName);

  if (!locationId) {
    return {
      success: false,
      error: `Unknown location: "${locationName}". Valid locations: Bellevue, Elkhorn, Gretna, Omaha`,
    };
  }

  const { data: blocks, error } = await supabase
    .from("schedule_blocks")
    .select("id, block_date, start_time, end_time, status, block_type, teacher_id, student_id, is_virtual, notes, checkin_status")
    .eq("tenant_id", TENANT_ID)
    .eq("location_id", locationId)
    .eq("block_date", date)
    .order("start_time", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!blocks || blocks.length === 0) {
    return {
      success: true,
      message: `No schedule blocks found for ${locationName} on ${date}`,
      blocks: [],
      openSlots: [],
      bookedSlots: [],
    };
  }

  // Get teacher names
  const teacherIds = [...new Set(blocks.map((b: any) => b.teacher_id).filter(Boolean))];
  const { data: teachers } = teacherIds.length > 0
    ? await supabase.from("teachers").select("id, first_name, last_name").in("id", teacherIds)
    : { data: [] };

  const teacherMap: Record<string, string> = Object.fromEntries(
    (teachers || []).map((t: any) => [t.id, `${t.first_name} ${t.last_name}`])
  );

  // Get student names
  const studentIds = [...new Set(blocks.map((b: any) => b.student_id).filter(Boolean))];
  const { data: students } = studentIds.length > 0
    ? await supabase.from("students").select("id, first_name, last_name").in("id", studentIds)
    : { data: [] };

  const studentMap: Record<string, string> = Object.fromEntries(
    (students || []).map((s: any) => [s.id, `${s.first_name} ${s.last_name}`])
  );

  // Enrich blocks with names
  const enriched = blocks.map((b: any) => ({
    id: b.id,
    date: b.block_date,
    startTime: b.start_time,
    endTime: b.end_time,
    status: b.status,
    type: b.block_type,
    checkinStatus: b.checkin_status,
    teacher: b.teacher_id ? (teacherMap[b.teacher_id] || "Unknown Teacher") : null,
    student: b.student_id ? (studentMap[b.student_id] || "Unknown Student") : null,
    isVirtual: b.is_virtual,
    notes: b.notes,
  }));

  const openSlots = enriched.filter((b) => b.status === "available");
  const bookedSlots = enriched.filter((b) => b.status !== "available");

  return {
    success: true,
    location: locationName,
    date,
    totalBlocks: blocks.length,
    openSlots,
    bookedSlots,
    summary: `${locationName} on ${date}: ${bookedSlots.length} booked, ${openSlots.length} open`,
  };
}

/**
 * check_conflicts
 * Detects scheduling conflicts for a teacher in a given time window on a date.
 */
export async function check_conflicts({
  locationName,
  teacherId,
  date,
  startTime,
  endTime,
}: {
  locationName: string;
  teacherId?: string;
  date: string;
  startTime: string;
  endTime: string;
}) {
  const supabase = getSupabase();
  const locationId = resolveLocationId(locationName);

  if (!locationId) {
    return { success: false, error: `Unknown location: "${locationName}"` };
  }

  let query = supabase
    .from("schedule_blocks")
    .select("id, start_time, end_time, teacher_id, student_id, status")
    .eq("tenant_id", TENANT_ID)
    .eq("location_id", locationId)
    .eq("block_date", date)
    .neq("status", "available")
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (teacherId) {
    query = query.eq("teacher_id", teacherId);
  }

  const { data: conflicts, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    hasConflict: (conflicts?.length || 0) > 0,
    conflicts: conflicts || [],
    count: conflicts?.length || 0,
  };
}

/**
 * suggest_slot
 * Returns available open slots for a given location and date.
 */
export async function suggest_slot({
  locationName,
  date,
  durationMinutes = 30,
}: {
  locationName: string;
  date: string;
  durationMinutes?: number;
}) {
  const result = await read_schedule({ locationName, date });
  if (!result.success) return result;

  const openSlots = (result.openSlots || []).slice(0, 5);

  return {
    success: true,
    location: locationName,
    date,
    availableSlots: openSlots,
    count: openSlots.length,
    message: openSlots.length > 0
      ? `Found ${openSlots.length} available slot(s) at ${locationName} on ${date}`
      : `No available slots at ${locationName} on ${date}`,
  };
}

/**
 * move_lesson (REQUIRES APPROVAL)
 * Reschedules a schedule_block to a new date/time.
 */
export async function move_lesson({
  blockId,
  newDate,
  newStartTime,
  newEndTime,
  reason,
}: {
  blockId: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}) {
  const supabase = getSupabase();

  const { data: block, error: fetchError } = await supabase
    .from("schedule_blocks")
    .select("id, block_date, start_time, end_time")
    .eq("id", blockId)
    .eq("tenant_id", TENANT_ID)
    .single();

  if (fetchError || !block) {
    return { success: false, error: "Schedule block not found" };
  }

  const { error: updateError } = await supabase
    .from("schedule_blocks")
    .update({
      block_date: newDate,
      start_time: newStartTime,
      end_time: newEndTime,
      updated_at: new Date().toISOString(),
      notes: reason,
    })
    .eq("id", blockId)
    .eq("tenant_id", TENANT_ID);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return {
    success: true,
    blockId,
    previousDate: block.block_date,
    previousTime: { start: block.start_time, end: block.end_time },
    newDate,
    newTime: { start: newStartTime, end: newEndTime },
    message: `Lesson moved to ${newDate} at ${newStartTime}. Reason: ${reason}`,
  };
}

export const RUBY_TOOLS = {
  read_schedule,
  check_conflicts,
  suggest_slot,
  move_lesson,
};
