/**
 * Ruby Tool Definitions — SCHEDULER & ORCHESTRATOR MODE
 * 
 * Focus:
 * 1. Conflict Arbiter (Teacher Callout & Batch Rescheduling)
 * 2. Revenue Optimizer (Gap Detection & Proactive Rescheduling)
 */
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

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
  if (locationInput.includes("-") && locationInput.length > 30) return locationInput;
  const key = locationInput.toLowerCase().replace(/\s+music\s+lessons?/i, "").trim();
  return LOCATION_MAP[key] || null;
}

/**
 * read_schedule
 */
export async function read_schedule({
  locationName,
  date,
}: {
  locationName: string;
  date: string;
}) {
  const supabase = getSupabase();
  const locationId = resolveLocationId(locationName);

  if (!locationId) {
    return { success: false, error: `Unknown location: "${locationName}"` };
  }

  const { data: blocks, error } = await supabase
    .from("schedule_blocks")
    .select("id, block_date, start_time, end_time, status, teacher_id, student_id")
    .eq("tenant_id", TENANT_ID)
    .eq("location_id", locationId)
    .eq("block_date", date)
    .order("start_time", { ascending: true });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    location: locationName,
    date,
    blocks: blocks || [],
    openSlots: (blocks || []).filter((b: any) => b.status === "available"),
    bookedSlots: (blocks || []).filter((b: any) => b.status === "booked"),
  };
}

/**
 * move_student
 */
export async function move_student({
  sourceBlockId,
  targetBlockId,
  reason,
}: {
  sourceBlockId: string;
  targetBlockId: string;
  reason: string;
}) {
  const supabase = getSupabase();

  const { data: sourceBlock, error: sourceError } = await supabase
    .from("schedule_blocks")
    .select("id, student_id")
    .eq("id", sourceBlockId)
    .single();

  if (sourceError || !sourceBlock?.student_id) {
    return { success: false, error: "Source block not found or has no student" };
  }

  // Transaction: Book target, Clear source
  const { error: targetErr } = await supabase
    .from("schedule_blocks")
    .update({ student_id: sourceBlock.student_id, status: "booked", notes: reason })
    .eq("id", targetBlockId);

  if (targetErr) return { success: false, error: targetErr.message };

  await supabase
    .from("schedule_blocks")
    .update({ student_id: null, status: "available", notes: `Moved to ${targetBlockId}` })
    .eq("id", sourceBlockId);

  return { success: true, message: `Moved student to block ${targetBlockId}`, studentId: sourceBlock.student_id };
}

/**
 * MISSION 1: handle_teacher_callout
 */
export async function handle_teacher_callout({
  teacherName,
  date,
  locationName,
}: {
  teacherName: string;
  date: string;
  locationName: string;
}) {
  const supabase = getSupabase();
  const locationId = resolveLocationId(locationName);

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .ilike("first_name", `%${teacherName}%`)
    .limit(1)
    .single();

  if (!teacher) return { success: false, error: `Teacher "${teacherName}" not found` };

  const { data: lessons } = await supabase
    .from("schedule_blocks")
    .select("id, start_time, end_time, student_id")
    .eq("teacher_id", teacher.id)
    .eq("block_date", date)
    .eq("status", "booked");

  if (!lessons || lessons.length === 0) {
    return { success: true, message: `No lessons found for ${teacherName} on ${date}`, proposals: [] };
  }

  const { data: openSlots } = await supabase
    .from("schedule_blocks")
    .select("id, start_time, end_time, teacher_id")
    .eq("location_id", locationId)
    .eq("block_date", date)
    .eq("status", "available");

  const proposals = lessons.map((lesson: any) => {
    const match = (openSlots || []).find((slot: any) => slot.start_time === lesson.start_time);
    return {
      studentBlockId: lesson.id,
      originalTime: lesson.start_time,
      suggestedBlockId: match?.id || null,
      suggestedTime: match?.start_time || "No direct match found",
      status: match ? "match_found" : "needs_manual_slot",
    };
  });

  return {
    success: true,
    teacherName,
    date,
    impactedCount: lessons.length,
    proposals,
  };
}

/**
 * MISSION 2: find_booking_gaps
 */
export async function find_booking_gaps({
  locationName,
  date,
}: {
  locationName: string;
  date: string;
}) {
  const { blocks, success, error } = await read_schedule({ locationName, date });
  if (!success) return { success: false, error };

  const gaps = [];
  for (let i = 1; i < blocks.length - 1; i++) {
    const prev = blocks[i - 1];
    const curr = blocks[i];
    const next = blocks[i + 1];

    if (prev.status === "booked" && curr.status === "available" && next.status === "booked") {
      gaps.push({
        gapBlockId: curr.id,
        time: curr.start_time,
        context: `Gap between ${prev.start_time} and ${next.start_time}`,
        recommendation: "Move a student here to free up a larger block elsewhere.",
      });
    }
  }

  return {
    success: true,
    location: locationName,
    date,
    gapCount: gaps.length,
    gaps,
  };
}

export const RUBY_TOOLS = {
  read_schedule,
  move_student,
  handle_teacher_callout,
  find_booking_gaps,
};
