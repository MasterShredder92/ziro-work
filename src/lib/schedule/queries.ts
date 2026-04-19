import {
  createLessonEvent as createEventRow,
  deleteLessonEvent as deleteEventRow,
  getLessonEvent,
  listLessonEvents,
  updateLessonEvent as updateEventRow,
  type LessonEventFilter,
} from "@data/lessonEvents";
import type {
  LessonEvent,
  LessonEventInsert,
  LessonEventUpdate,
  ScheduleRange,
} from "./types";
import { computeEventConflicts } from "./availability";

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export type ListEventsInput = {
  range?: ScheduleRange;
  teacherId?: string;
  studentId?: string;
  familyId?: string;
  roomId?: string;
  locationId?: string;
  status?: string;
  kind?: string;
  recurrenceId?: string;
  limit?: number;
};

export async function listEvents(
  tenantId: string,
  input?: ListEventsInput,
): Promise<LessonEvent[]> {
  const filter: LessonEventFilter = {
    teacher_id: input?.teacherId,
    student_id: input?.studentId,
    family_id: input?.familyId,
    room_id: input?.roomId,
    location_id: input?.locationId,
    status: input?.status,
    kind: input?.kind,
    recurrence_id: input?.recurrenceId,
    start_from: input?.range?.start,
    start_to: input?.range?.end,
  };
  return listLessonEvents(tenantId, filter, { limit: input?.limit ?? 500 });
}

export async function getEvent(
  tenantId: string,
  id: string,
): Promise<LessonEvent | null> {
  return getLessonEvent(id, tenantId);
}

export type CreateEventInput = Omit<LessonEventInsert, "tenantId" | "id"> & {
  id?: string;
};

async function findConflictingEvents(
  tenantId: string,
  input: Pick<
    LessonEvent,
    "startTime" | "endTime" | "teacherId" | "studentId" | "roomId"
  >,
  excludeId?: string,
): Promise<LessonEvent[]> {
  const bufferStart = new Date(
    new Date(input.startTime).getTime() - 24 * 60 * 60 * 1000,
  ).toISOString();
  const bufferEnd = new Date(
    new Date(input.endTime).getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();

  const all = await listLessonEvents(
    tenantId,
    { start_from: bufferStart, start_to: bufferEnd },
    { limit: 1000 },
  );

  return all.filter((ev) => {
    if (ev.id === excludeId) return false;
    if (!overlap(input.startTime, input.endTime, ev.startTime, ev.endTime)) {
      return false;
    }
    if (input.teacherId && ev.teacherId === input.teacherId) return true;
    if (input.roomId && ev.roomId === input.roomId) return true;
    if (input.studentId && ev.studentId === input.studentId) return true;
    return false;
  });
}

export async function createEvent(
  tenantId: string,
  input: CreateEventInput,
  opts?: { allowConflict?: boolean },
): Promise<LessonEvent> {
  if (!opts?.allowConflict) {
    const conflicts = await findConflictingEvents(tenantId, {
      startTime: input.startTime,
      endTime: input.endTime,
      teacherId: input.teacherId,
      studentId: input.studentId,
      roomId: input.roomId,
    });
    if (conflicts.length > 0) {
      const err = new Error("Event conflicts with existing schedule.") as Error & {
        code?: string;
        conflicts?: LessonEvent[];
      };
      err.code = "SCHEDULE_CONFLICT";
      err.conflicts = conflicts;
      throw err;
    }
  }
  return createEventRow(tenantId, { ...input, tenantId });
}

export async function updateEvent(
  tenantId: string,
  id: string,
  patch: LessonEventUpdate,
  opts?: { allowConflict?: boolean },
): Promise<LessonEvent> {
  const current = await getLessonEvent(id, tenantId);
  if (!current) throw new Error(`lesson_event ${id} not found`);

  const next = {
    startTime: patch.startTime ?? current.startTime,
    endTime: patch.endTime ?? current.endTime,
    teacherId: patch.teacherId ?? current.teacherId,
    studentId: patch.studentId ?? current.studentId,
    roomId: patch.roomId ?? current.roomId,
  };

  const timingOrAssignmentChanged =
    patch.startTime !== undefined ||
    patch.endTime !== undefined ||
    patch.teacherId !== undefined ||
    patch.studentId !== undefined ||
    patch.roomId !== undefined;

  if (timingOrAssignmentChanged && !opts?.allowConflict) {
    const conflicts = await findConflictingEvents(tenantId, next, id);
    if (conflicts.length > 0) {
      const err = new Error("Update conflicts with existing schedule.") as Error & {
        code?: string;
        conflicts?: LessonEvent[];
      };
      err.code = "SCHEDULE_CONFLICT";
      err.conflicts = conflicts;
      throw err;
    }
  }

  return updateEventRow(id, tenantId, patch);
}

export async function deleteEvent(
  tenantId: string,
  id: string,
): Promise<void> {
  await deleteEventRow(id, tenantId);
}

export async function listEventsWithConflicts(
  tenantId: string,
  input?: ListEventsInput,
): Promise<{
  events: LessonEvent[];
  conflicts: ReturnType<typeof computeEventConflicts>;
}> {
  const events = await listEvents(tenantId, input);
  const conflicts = computeEventConflicts(events);
  return { events, conflicts };
}
