import {
  createScheduleBlock,
  findConflictingBlocks,
  getScheduleBlockById,
  listScheduleBlocks,
  updateScheduleBlock,
  type ScheduleBlockFilter,
} from "@data/scheduleBlocks";
import {
  createSessionLog,
  getSessionLogByBlockId,
  updateSessionLog,
} from "@data/sessionLog";
import type {
  ScheduleBlock,
  ScheduleBlockInsert,
  ScheduleBlockUpdate,
  SessionLog,
  SessionLogInsert,
} from "@/lib/types/entities";

export type CreateBlockInput = Omit<ScheduleBlockInsert, "tenant_id">;

export async function bookBlock(
  tenantId: string,
  input: CreateBlockInput,
  opts?: { allowConflict?: boolean },
): Promise<ScheduleBlock> {
  if (!opts?.allowConflict) {
    const conflicts = await findConflictingBlocks(
      tenantId,
      input.teacher_id,
      input.block_date,
      input.start_time,
      input.end_time,
    );
    if (conflicts.length > 0) {
      const err = new Error("Teacher has conflicting block(s).") as Error & {
        code?: string;
        conflicts?: ScheduleBlock[];
      };
      err.code = "SCHEDULE_CONFLICT";
      err.conflicts = conflicts;
      throw err;
    }
  }
  return createScheduleBlock(tenantId, input);
}

export async function rescheduleBlock(
  tenantId: string,
  id: string,
  patch: ScheduleBlockUpdate,
  opts?: { allowConflict?: boolean },
): Promise<ScheduleBlock> {
  const current = await getScheduleBlockById(id, tenantId);
  if (!current) throw new Error(`schedule_block ${id} not found`);

  const teacherId = patch.teacher_id ?? current.teacher_id;
  const blockDate = patch.block_date ?? current.block_date;
  const startTime = patch.start_time ?? current.start_time;
  const endTime = patch.end_time ?? current.end_time;

  const changed =
    patch.teacher_id !== undefined ||
    patch.block_date !== undefined ||
    patch.start_time !== undefined ||
    patch.end_time !== undefined;

  if (changed && !opts?.allowConflict) {
    const conflicts = await findConflictingBlocks(
      tenantId,
      teacherId,
      blockDate,
      startTime,
      endTime,
      id,
    );
    if (conflicts.length > 0) {
      const err = new Error("Teacher has conflicting block(s).") as Error & {
        code?: string;
        conflicts?: ScheduleBlock[];
      };
      err.code = "SCHEDULE_CONFLICT";
      err.conflicts = conflicts;
      throw err;
    }
  }

  return updateScheduleBlock(id, tenantId, patch);
}

export async function cancelBlock(
  tenantId: string,
  id: string,
  reason?: string,
): Promise<ScheduleBlock> {
  return updateScheduleBlock(id, tenantId, {
    status: "available",
    block_type: "call_out",
    callout_reason: reason ?? null,
  });
}

export async function checkInBlock(
  tenantId: string,
  id: string,
  checkedInBy: string,
): Promise<ScheduleBlock> {
  return updateScheduleBlock(id, tenantId, {
    checked_in: true,
    checked_in_at: new Date().toISOString(),
    checked_in_by: checkedInBy,
  });
}

export async function upsertSessionLogForBlock(
  tenantId: string,
  blockId: string,
  data: Omit<
    SessionLogInsert,
    "tenant_id" | "schedule_block_id" | "block_date" | "location_id" | "student_id" | "teacher_id" | "student_rate" | "teacher_rate"
  > &
    Partial<
      Pick<
        SessionLogInsert,
        "block_date" | "location_id" | "student_id" | "teacher_id" | "student_rate" | "teacher_rate"
      >
    >,
): Promise<SessionLog> {
  const existing = await getSessionLogByBlockId(blockId, tenantId);
  if (existing) {
    return updateSessionLog(existing.id, tenantId, data);
  }

  const block = await getScheduleBlockById(blockId, tenantId);
  if (!block) throw new Error(`schedule_block ${blockId} not found`);
  if (!block.student_id) {
    throw new Error(
      `schedule_block ${blockId} has no student_id; cannot create session_log.`,
    );
  }

  return createSessionLog(tenantId, {
    ...data,
    schedule_block_id: blockId,
    block_date: data.block_date ?? block.block_date,
    location_id: data.location_id ?? block.location_id,
    student_id: data.student_id ?? block.student_id,
    teacher_id: data.teacher_id ?? block.teacher_id,
    student_rate: data.student_rate ?? 0,
    teacher_rate: data.teacher_rate ?? 0,
  });
}

export { listScheduleBlocks, type ScheduleBlockFilter };

export type DetectConflictsInput = {
  teacherId: string;
  start: string;
  end: string;
  tenantId: string;
  excludeBlockId?: string;
};

function splitDateTime(value: string): { date: string; time: string } {
  if (value.includes("T")) {
    const [date, timePart] = value.split("T");
    const time = (timePart ?? "").replace(/(Z|[+-]\d{2}:?\d{2})$/, "").slice(0, 8);
    return { date, time: time.length >= 5 ? time : `${time}:00`.slice(0, 8) };
  }
  if (value.includes(" ")) {
    const [date, timePart] = value.split(" ");
    return { date, time: (timePart ?? "").slice(0, 8) };
  }
  throw new Error(
    `Invalid datetime "${value}"; expected ISO or "YYYY-MM-DD HH:MM:SS"`,
  );
}

export async function detectConflicts(
  input: DetectConflictsInput,
): Promise<ScheduleBlock[]> {
  const { date: startDate, time: startTime } = splitDateTime(input.start);
  const { date: endDate, time: endTime } = splitDateTime(input.end);
  if (startDate !== endDate) {
    throw new Error(
      `detectConflicts requires start and end on the same date (got ${startDate} vs ${endDate})`,
    );
  }
  return findConflictingBlocks(
    input.tenantId,
    input.teacherId,
    startDate,
    startTime,
    endTime,
    input.excludeBlockId,
  );
}

export type LogSessionPayload = Partial<
  Omit<SessionLogInsert, "tenant_id" | "schedule_block_id">
>;

export async function logSession(
  blockId: string,
  payload: LogSessionPayload,
  tenantId: string,
): Promise<SessionLog> {
  const block = await getScheduleBlockById(blockId, tenantId);
  if (!block) throw new Error(`schedule_block ${blockId} not found`);
  if (!block.student_id) {
    throw new Error(
      `schedule_block ${blockId} has no student_id; cannot create session_log.`,
    );
  }

  const insert: Omit<SessionLogInsert, "tenant_id"> = {
    ...payload,
    schedule_block_id: blockId,
    block_date: payload.block_date ?? block.block_date,
    location_id: payload.location_id ?? block.location_id,
    student_id: payload.student_id ?? block.student_id,
    teacher_id: payload.teacher_id ?? block.teacher_id,
    student_rate: payload.student_rate ?? 0,
    teacher_rate: payload.teacher_rate ?? 0,
  };

  return createSessionLog(tenantId, insert);
}
