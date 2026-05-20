import "server-only";

import { findConflictingBlocks, listScheduleBlocks } from "@data/scheduleBlocks";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import type { ScheduleBlock } from "@/lib/types/entities";

type SubCoverageInput = {
  tenantId: string;
  blockDate: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  locationId: string;
  originalTeacherId: string | null | undefined;
  excludeBlockId?: string;
};

type SubCoverageValidation =
  | { ok: true; originalTeacherName: string | null }
  | { ok: false; error: string; details?: unknown };

function toMinuteOfDay(value: string): number {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinuteOfDay(aStart) < toMinuteOfDay(bEnd) && toMinuteOfDay(aEnd) > toMinuteOfDay(bStart);
}

function isoDateToDayOfWeek(isoDate: string): string {
  const dow = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();
  switch (dow) {
    case 0:
      return "sunday";
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    case 6:
      return "saturday";
    default:
      return "monday";
  }
}

function isCalloutBlock(block: ScheduleBlock): boolean {
  return (
    block.block_type === "call_out" ||
    Boolean(block.callout_id) ||
    Boolean(block.is_family_callout)
  );
}

function formatTeacherName(row: { name?: string | null; first_name?: string | null; last_name?: string | null }): string {
  const explicit = typeof row.name === "string" ? row.name.trim() : "";
  if (explicit) return explicit;
  const first = typeof row.first_name === "string" ? row.first_name.trim() : "";
  const last = typeof row.last_name === "string" ? row.last_name.trim() : "";
  const full = `${first} ${last}`.trim();
  return full || "Teacher";
}

export async function validateSubCoverage(
  input: SubCoverageInput,
): Promise<SubCoverageValidation> {
  const originalTeacherId =
    typeof input.originalTeacherId === "string" ? input.originalTeacherId.trim() : "";
  if (!originalTeacherId) {
    return { ok: false, error: "Sub coverage requires original_teacher_id." };
  }
  if (originalTeacherId === input.teacherId) {
    return {
      ok: false,
      error: "Sub coverage teacher must differ from original teacher.",
    };
  }

  const calloutCandidates = await listScheduleBlocks(
    input.tenantId,
    {
      teacher_id: originalTeacherId,
      location_id: input.locationId,
      date_from: input.blockDate,
      date_to: input.blockDate,
    },
    { limit: 200 },
  );

  const hasSourceCallout = calloutCandidates.some(
    (block) =>
      block.id !== input.excludeBlockId &&
      isCalloutBlock(block) &&
      overlaps(block.start_time, block.end_time, input.startTime, input.endTime),
  );
  if (!hasSourceCallout) {
    return {
      ok: false,
      error: "Sub coverage requires an overlapping original teacher call out.",
    };
  }

  const conflicts = await findConflictingBlocks(
    input.tenantId,
    input.teacherId,
    input.blockDate,
    input.startTime,
    input.endTime,
    input.excludeBlockId,
  );
  if (conflicts.length > 0) {
    return {
      ok: false,
      error: "Substitute teacher has conflicting block(s).",
      details: conflicts.map((block) => ({
        id: block.id,
        block_date: block.block_date,
        start_time: block.start_time,
        end_time: block.end_time,
        status: block.status,
      })),
    };
  }

  assertServiceRoleAllowed("src/lib/schedule/subCoverageIntegrity.ts — service-role module; internal/background operations only");
  const supabase = getServiceClient();
  const dayOfWeek = isoDateToDayOfWeek(input.blockDate);
  const { data: availabilityRows, error: availabilityError } = await supabase
    .from("teacher_availability")
    .select("start_time,end_time")
    .eq("tenant_id", input.tenantId)
    .eq("location_id", input.locationId)
    .eq("teacher_id", input.teacherId)
    .eq("is_active", true)
    .eq("day_of_week", dayOfWeek);

  if (availabilityError) {
    return { ok: false, error: "Unable to validate substitute availability." };
  }

  const hasAvailability = (availabilityRows ?? []).some(
    (row) =>
      toMinuteOfDay(String(row.start_time)) <= toMinuteOfDay(input.startTime) &&
      toMinuteOfDay(String(row.end_time)) >= toMinuteOfDay(input.endTime),
  );
  if (!hasAvailability) {
    return {
      ok: false,
      error: "Substitute teacher is unavailable for this time window.",
    };
  }

  const { data: originalTeacher } = await supabase
    .from("teachers")
    .select("name,first_name,last_name")
    .eq("tenant_id", input.tenantId)
    .eq("id", originalTeacherId)
    .maybeSingle();

  return {
    ok: true,
    originalTeacherName: originalTeacher ? formatTeacherName(originalTeacher) : null,
  };
}
