/**
 * Ruby Tool Definitions
 * 
 * These are the "Hands" that allow Ruby to interact with the ZiroWork schedule.
 * Built on the Vercel AI SDK ToolLoopAgent pattern.
 * 
 * Tools:
 * - read_schedule: View the current schedule for a studio
 * - check_conflicts: Detect scheduling conflicts
 * - suggest_slot: Recommend available time slots
 * - move_lesson: Reschedule a lesson (requires approval)
 * - add_lesson: Create a new lesson (requires approval)
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * read_schedule
 * Returns the full schedule for a given studio and date range
 */
export async function read_schedule({
  studioId,
  startDate,
  endDate,
}: {
  studioId: string;
  startDate: string;
  endDate: string;
}) {
  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id,
      start_time,
      end_time,
      student:students(id, first_name, last_name),
      instructor:instructors(id, first_name, last_name),
      room:rooms(id, name),
      status
    `)
    .eq("studio_id", studioId)
    .gte("start_time", startDate)
    .lte("end_time", endDate)
    .order("start_time", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    lessons: data,
    count: data?.length || 0,
    dateRange: { startDate, endDate },
  };
}

/**
 * check_conflicts
 * Detects scheduling conflicts for a given instructor or room
 */
export async function check_conflicts({
  studioId,
  instructorId,
  roomId,
  startTime,
  endTime,
}: {
  studioId: string;
  instructorId?: string;
  roomId?: string;
  startTime: string;
  endTime: string;
}) {
  let query = supabase
    .from("lessons")
    .select("id, start_time, end_time, instructor_id, room_id, status")
    .eq("studio_id", studioId)
    .neq("status", "cancelled")
    .or(`start_time.lt.${endTime},end_time.gt.${startTime}`);

  if (instructorId) {
    query = query.eq("instructor_id", instructorId);
  }

  if (roomId) {
    query = query.eq("room_id", roomId);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const hasConflict = (data?.length || 0) > 0;

  return {
    success: true,
    hasConflict,
    conflicts: data || [],
    message: hasConflict
      ? `Found ${data?.length} conflict(s) in the requested time slot`
      : "No conflicts detected",
  };
}

/**
 * suggest_slot
 * Recommends available time slots for a given instructor and duration
 */
export async function suggest_slot({
  studioId,
  instructorId,
  durationMinutes,
  preferredDate,
}: {
  studioId: string;
  instructorId: string;
  durationMinutes: number;
  preferredDate: string;
}) {
  // Get instructor's existing schedule for the day
  const dayStart = `${preferredDate}T00:00:00`;
  const dayEnd = `${preferredDate}T23:59:59`;

  const { data: existingLessons, error } = await supabase
    .from("lessons")
    .select("start_time, end_time")
    .eq("studio_id", studioId)
    .eq("instructor_id", instructorId)
    .gte("start_time", dayStart)
    .lte("end_time", dayEnd)
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  // Find available slots between 9am and 9pm
  const workdayStart = 9 * 60; // 9am in minutes
  const workdayEnd = 21 * 60; // 9pm in minutes
  const availableSlots: { startTime: string; endTime: string }[] = [];

  let currentMinute = workdayStart;

  for (const lesson of existingLessons || []) {
    const lessonStart = new Date(lesson.start_time);
    const lessonStartMinute =
      lessonStart.getHours() * 60 + lessonStart.getMinutes();

    if (currentMinute + durationMinutes <= lessonStartMinute) {
      // There's a gap before this lesson
      const slotStart = new Date(`${preferredDate}T00:00:00`);
      slotStart.setMinutes(currentMinute);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);

      availableSlots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
      });
    }

    const lessonEnd = new Date(lesson.end_time);
    currentMinute = lessonEnd.getHours() * 60 + lessonEnd.getMinutes();
  }

  // Check for slots after the last lesson
  if (currentMinute + durationMinutes <= workdayEnd) {
    const slotStart = new Date(`${preferredDate}T00:00:00`);
    slotStart.setMinutes(currentMinute);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + durationMinutes);

    availableSlots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
    });
  }

  return {
    success: true,
    availableSlots: availableSlots.slice(0, 5), // Return top 5 suggestions
    count: availableSlots.length,
    message: `Found ${availableSlots.length} available slot(s) for ${durationMinutes}-minute lesson`,
  };
}

/**
 * move_lesson (REQUIRES APPROVAL)
 * Reschedules a lesson to a new time slot
 */
export async function move_lesson({
  lessonId,
  newStartTime,
  newEndTime,
  reason,
}: {
  lessonId: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
}) {
  // First verify the lesson exists
  const { data: lesson, error: fetchError } = await supabase
    .from("lessons")
    .select("id, start_time, end_time, instructor_id, room_id, studio_id")
    .eq("id", lessonId)
    .single();

  if (fetchError || !lesson) {
    return { success: false, error: "Lesson not found" };
  }

  // Check for conflicts at the new time
  const conflicts = await check_conflicts({
    studioId: lesson.studio_id,
    instructorId: lesson.instructor_id,
    roomId: lesson.room_id,
    startTime: newStartTime,
    endTime: newEndTime,
  });

  if (conflicts.hasConflict) {
    return {
      success: false,
      error: "Cannot move lesson: conflicts detected at the new time",
      conflicts: conflicts.conflicts,
    };
  }

  // Update the lesson
  const { error: updateError } = await supabase
    .from("lessons")
    .update({
      start_time: newStartTime,
      end_time: newEndTime,
      updated_at: new Date().toISOString(),
      notes: reason,
    })
    .eq("id", lessonId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return {
    success: true,
    lessonId,
    previousTime: { start: lesson.start_time, end: lesson.end_time },
    newTime: { start: newStartTime, end: newEndTime },
    message: `Lesson successfully moved. Reason: ${reason}`,
  };
}

/**
 * add_lesson (REQUIRES APPROVAL)
 * Creates a new lesson in the schedule
 */
export async function add_lesson({
  studioId,
  studentId,
  instructorId,
  roomId,
  startTime,
  endTime,
  lessonType,
  notes,
}: {
  studioId: string;
  studentId: string;
  instructorId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  lessonType: string;
  notes?: string;
}) {
  // Check for conflicts before creating
  const conflicts = await check_conflicts({
    studioId,
    instructorId,
    roomId,
    startTime,
    endTime,
  });

  if (conflicts.hasConflict) {
    return {
      success: false,
      error: "Cannot add lesson: conflicts detected",
      conflicts: conflicts.conflicts,
    };
  }

  // Create the lesson
  const { data, error } = await supabase
    .from("lessons")
    .insert([
      {
        studio_id: studioId,
        student_id: studentId,
        instructor_id: instructorId,
        room_id: roomId,
        start_time: startTime,
        end_time: endTime,
        lesson_type: lessonType,
        notes,
        status: "scheduled",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    lesson: data,
    message: `New ${lessonType} lesson created successfully`,
  };
}

export const RUBY_TOOLS = {
  read_schedule,
  check_conflicts,
  suggest_slot,
  move_lesson,
  add_lesson,
};
