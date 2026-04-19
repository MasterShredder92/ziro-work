import {
  createTeacherAvailability,
  deleteTeacherAvailability,
  listTeacherAvailability,
  updateTeacherAvailability,
} from "@data/teacherAvailability";
import { listLessonEvents } from "@data/lessonEvents";
import { listRoomBookings } from "@data/roomBookings";
import type {
  LessonEvent,
  RoomBooking,
  ScheduleConflict,
  ScheduleRange,
  TeacherAvailability,
  TeacherAvailabilityInsert,
  TeacherAvailabilityUpdate,
} from "./types";

export type WeeklyAvailability = {
  teacherId: string;
  tenantId: string;
  slots: TeacherAvailability[];
};

export async function getTeacherWeeklyAvailability(
  tenantId: string,
  teacherId: string,
): Promise<WeeklyAvailability> {
  const slots = await listTeacherAvailability(tenantId, {
    teacher_id: teacherId,
  });
  return { tenantId, teacherId, slots };
}

export async function setTeacherAvailability(
  tenantId: string,
  teacherId: string,
  slots: Array<
    Omit<TeacherAvailabilityInsert, "tenantId" | "teacherId">
  >,
): Promise<TeacherAvailability[]> {
  const existing = await listTeacherAvailability(tenantId, {
    teacher_id: teacherId,
  });
  for (const e of existing) {
    await deleteTeacherAvailability(e.id, tenantId);
  }
  const created: TeacherAvailability[] = [];
  for (const slot of slots) {
    const row = await createTeacherAvailability(tenantId, {
      ...slot,
      tenantId,
      teacherId,
    });
    created.push(row);
  }
  return created;
}

export async function upsertTeacherAvailabilitySlot(
  tenantId: string,
  id: string | null,
  input:
    | TeacherAvailabilityInsert
    | (TeacherAvailabilityUpdate & { teacherId?: string }),
): Promise<TeacherAvailability> {
  if (id) {
    return updateTeacherAvailability(
      id,
      tenantId,
      input as TeacherAvailabilityUpdate,
    );
  }
  const ins = input as TeacherAvailabilityInsert;
  return createTeacherAvailability(tenantId, {
    ...ins,
    tenantId,
  });
}

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

export async function detectEventConflicts(
  tenantId: string,
  range: ScheduleRange,
): Promise<ScheduleConflict[]> {
  const events = await listLessonEvents(
    tenantId,
    { start_from: range.start, start_to: range.end },
    { limit: 5000 },
  );
  return computeEventConflicts(events);
}

export function computeEventConflicts(events: LessonEvent[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (!overlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

      if (a.teacherId && b.teacherId && a.teacherId === b.teacherId) {
        conflicts.push({
          id: `${a.id}__${b.id}__teacher`,
          kind: "teacher_overlap",
          eventIds: [a.id, b.id],
          startTime: a.startTime,
          endTime: a.endTime,
          teacherId: a.teacherId,
          roomId: a.roomId ?? null,
          studentId: a.studentId ?? null,
          reason: "Teacher double-booked",
        });
      }
      if (a.roomId && b.roomId && a.roomId === b.roomId) {
        conflicts.push({
          id: `${a.id}__${b.id}__room`,
          kind: "room_overlap",
          eventIds: [a.id, b.id],
          startTime: a.startTime,
          endTime: a.endTime,
          teacherId: a.teacherId ?? null,
          roomId: a.roomId,
          studentId: a.studentId ?? null,
          reason: "Room double-booked",
        });
      }
      if (a.studentId && b.studentId && a.studentId === b.studentId) {
        conflicts.push({
          id: `${a.id}__${b.id}__student`,
          kind: "student_overlap",
          eventIds: [a.id, b.id],
          startTime: a.startTime,
          endTime: a.endTime,
          teacherId: a.teacherId ?? null,
          roomId: a.roomId ?? null,
          studentId: a.studentId,
          reason: "Student double-booked",
        });
      }
    }
  }
  return conflicts;
}

export async function getRoomBookingsInRange(
  tenantId: string,
  roomId: string,
  range: ScheduleRange,
): Promise<RoomBooking[]> {
  return listRoomBookings(
    tenantId,
    { room_id: roomId, start_from: range.start, start_to: range.end },
    { limit: 5000 },
  );
}

export function isTeacherAvailableAt(
  availability: TeacherAvailability[],
  start: string,
  end: string,
): boolean {
  const startDate = new Date(start);
  const dow = startDate.getUTCDay();
  const startMin = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
  const endDate = new Date(end);
  const endMin = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();

  for (const a of availability) {
    if (a.dayOfWeek !== dow) continue;
    const [ah, am] = a.startTime.split(":").map((s) => Number(s));
    const [bh, bm] = a.endTime.split(":").map((s) => Number(s));
    const aStart = ah * 60 + am;
    const aEnd = bh * 60 + bm;
    if (startMin >= aStart && endMin <= aEnd) return true;
  }
  return false;
}
