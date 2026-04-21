import { getServiceClient } from "@/lib/supabase";
import type { ScheduleBlock } from "@/lib/types/entities";

/**
 * Ruby's Scheduling Tools
 * Handles all scheduling operations: availability queries, moves, swaps, makeups, and notifications
 */

export async function findAvailableSlots(
  tenantId: string,
  filters: {
    teacherId?: string;
    instrument?: string;
    locationId?: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    duration: number; // minutes (30 or 60)
    preferredTimes?: string[]; // ["09:00", "14:00", etc.]
  },
): Promise<
  Array<{
    date: string;
    time: string;
    teacherId: string;
    teacherName: string;
    locationId: string;
    locationName: string;
  }>
> {
  const supabase = getServiceClient();

  // Get all teachers matching the filter
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, first_name, last_name, instruments")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .then((res) => {
      if (filters.teacherId) {
        return supabase
          .from("teachers")
          .select("id, first_name, last_name, instruments")
          .eq("id", filters.teacherId)
          .eq("tenant_id", tenantId);
      }
      if (filters.instrument) {
        return supabase
          .from("teachers")
          .select("id, first_name, last_name, instruments")
          .eq("tenant_id", tenantId)
          .eq("is_active", true)
          .contains("instruments", [filters.instrument]);
      }
      return res;
    });

  if (!teachers || teachers.length === 0) {
    return [];
  }

  // Get all booked blocks in the date range to find gaps
  const { data: bookedBlocks } = await supabase
    .from("schedule_blocks")
    .select("id, teacher_id, block_date, start_time, end_time, location_id")
    .eq("tenant_id", tenantId)
    .gte("block_date", filters.startDate)
    .lte("block_date", filters.endDate)
    .in(
      "teacher_id",
      teachers.map((t: any) => t.id),
    );

  // Get locations
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name")
    .eq("tenant_id", tenantId);

  const locationMap = Object.fromEntries((locations || []).map((l: any) => [l.id, l.name]));

  // Build availability map
  const available: Array<{
    date: string;
    time: string;
    teacherId: string;
    teacherName: string;
    locationId: string;
    locationName: string;
  }> = [];

  for (const teacher of teachers) {
    const teacherName = `${teacher.first_name} ${teacher.last_name}`;

    // Generate all possible time slots for this teacher in the date range
    const currentDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Check if teacher has booked blocks on this date
      const dayBlocks = (bookedBlocks || []).filter(
        (b: any) => b.teacher_id === teacher.id && b.block_date === dateStr,
      );

      // Generate slots (assuming studio hours 9 AM to 7 PM, 30-min increments)
      for (let hour = 9; hour < 19; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
          const slotEnd = `${String(hour + Math.floor((minute + filters.duration) / 60)).padStart(2, "0")}:${String((minute + filters.duration) % 60).padStart(2, "0")}`;

          // Check if this slot conflicts with any booked blocks
          const hasConflict = dayBlocks.some(
            (b: any) => !(b.end_time <= slotTime || b.start_time >= slotEnd),
          );

          if (!hasConflict) {
            if (!filters.preferredTimes || filters.preferredTimes.includes(slotTime)) {
              available.push({
                date: dateStr,
                time: slotTime,
                teacherId: teacher.id,
                teacherName,
                locationId: filters.locationId || "primary",
                locationName: locationMap[filters.locationId || "primary"] || "Primary Location",
              });
            }
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return available;
}

export async function moveBlock(
  tenantId: string,
  blockId: string,
  newDate: string,
  newTime: string,
  scope: "this_only" | "all_recurring",
): Promise<{ success: boolean; message: string; blockIds: string[] }> {
  const supabase = getServiceClient();

  // Get the current block
  const { data: currentBlock, error: fetchError } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("id", blockId)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !currentBlock) {
    return { success: false, message: "Block not found", blockIds: [] };
  }

  const movedBlockIds = [blockId];

  if (scope === "all_recurring" && currentBlock.recurring_pattern) {
    // Move all blocks in the recurring series
    const { data: recurringBlocks } = await supabase
      .from("schedule_blocks")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("recurring_pattern", currentBlock.recurring_pattern)
      .gte("block_date", currentBlock.block_date);

    if (recurringBlocks) {
      movedBlockIds.push(...recurringBlocks.map((b: any) => b.id));
    }
  }

  // Update all affected blocks
  const { error: updateError } = await supabase
    .from("schedule_blocks")
    .update({
      block_date: newDate,
      start_time: newTime,
      updated_at: new Date().toISOString(),
    })
    .in("id", movedBlockIds)
    .eq("tenant_id", tenantId);

  if (updateError) {
    return { success: false, message: `Failed to move block: ${updateError.message}`, blockIds: [] };
  }

  return {
    success: true,
    message: `Moved ${movedBlockIds.length} block(s) to ${newDate} at ${newTime}`,
    blockIds: movedBlockIds,
  };
}

export async function swapTeacher(
  tenantId: string,
  blockId: string,
  newTeacherId: string,
  scope: "this_only" | "all_recurring",
): Promise<{ success: boolean; message: string; blockIds: string[] }> {
  const supabase = getServiceClient();

  // Get the current block
  const { data: currentBlock, error: fetchError } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("id", blockId)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !currentBlock) {
    return { success: false, message: "Block not found", blockIds: [] };
  }

  // Verify new teacher exists and teaches the same instrument
  const { data: newTeacher } = await supabase
    .from("teachers")
    .select("instruments")
    .eq("id", newTeacherId)
    .eq("tenant_id", tenantId)
    .single();

  if (!newTeacher) {
    return { success: false, message: "New teacher not found", blockIds: [] };
  }

  const swappedBlockIds = [blockId];

  if (scope === "all_recurring" && currentBlock.recurring_pattern) {
    const { data: recurringBlocks } = await supabase
      .from("schedule_blocks")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("recurring_pattern", currentBlock.recurring_pattern)
      .gte("block_date", currentBlock.block_date);

    if (recurringBlocks) {
      swappedBlockIds.push(...recurringBlocks.map((b: any) => b.id));
    }
  }

  // Update all affected blocks
  const { error: updateError } = await supabase
    .from("schedule_blocks")
    .update({
      teacher_id: newTeacherId,
      updated_at: new Date().toISOString(),
    })
    .in("id", swappedBlockIds)
    .eq("tenant_id", tenantId);

  if (updateError) {
    return {
      success: false,
      message: `Failed to swap teacher: ${updateError.message}`,
      blockIds: [],
    };
  }

  return {
    success: true,
    message: `Swapped teacher for ${swappedBlockIds.length} block(s)`,
    blockIds: swappedBlockIds,
  };
}

export async function manageMakeupCredit(
  tenantId: string,
  studentId: string,
  reason: string,
): Promise<{ success: boolean; message: string; creditId?: string }> {
  const supabase = getServiceClient();

  // Create a makeup credit record
  const { data: credit, error: insertError } = await supabase
    .from("makeup_credits")
    .insert({
      tenant_id: tenantId,
      student_id: studentId,
      reason,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return { success: false, message: `Failed to create makeup credit: ${insertError.message}` };
  }

  return {
    success: true,
    message: `Makeup credit created for ${studentId}`,
    creditId: credit?.id,
  };
}

export async function getStudentSchedule(
  tenantId: string,
  studentId: string,
  daysAhead: number = 30,
): Promise<ScheduleBlock[]> {
  const supabase = getServiceClient();

  const startDate = new Date().toISOString().split("T")[0];
  const endDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: blocks } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("student_id", studentId)
    .gte("block_date", startDate)
    .lte("block_date", endDate)
    .order("block_date", { ascending: true });

  return blocks || [];
}

export async function getTeacherAvailability(
  tenantId: string,
  teacherId: string,
  startDate: string,
  endDate: string,
): Promise<{
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  utilizationPercent: number;
}> {
  const supabase = getServiceClient();

  // Get all blocks for this teacher in the date range
  const { data: blocks } = await supabase
    .from("schedule_blocks")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("teacher_id", teacherId)
    .gte("block_date", startDate)
    .lte("block_date", endDate);

  const totalSlots = blocks?.length || 0;
  const bookedSlots = blocks?.filter((b: any) => b.status === "booked").length || 0;
  const availableSlots = totalSlots - bookedSlots;
  const utilizationPercent = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  return {
    totalSlots,
    bookedSlots,
    availableSlots,
    utilizationPercent,
  };
}
