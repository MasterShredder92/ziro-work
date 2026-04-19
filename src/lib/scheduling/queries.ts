import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listRooms } from "@data/rooms";
import { listTeachers as listTeachersRaw } from "@data/teachers";
import { listStudents } from "@data/students";
import type { Room, ScheduleBlock, Student, Teacher } from "@/lib/types/entities";

async function listTeachers(
  tenantId: string,
  filter?: Parameters<typeof listTeachersRaw>[1],
  opts?: Parameters<typeof listTeachersRaw>[2],
): Promise<Teacher[]> {
  const rows = await listTeachersRaw(tenantId, filter, opts);
  return rows as unknown as Teacher[];
}
import type {
  ConflictItem,
  RoomAvailability,
  RoomAvailabilityBucket,
  ScheduleRange,
  SuggestedSlot,
  TeacherAvailability,
  TeacherAvailabilityBucket,
} from "./types";

function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function minutesToClock(total: number): string {
  const safe = Math.max(0, Math.min(24 * 60, Math.floor(total)));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function durationMinutes(block: ScheduleBlock): number {
  const start = parseTimeToMinutes(block.start_time);
  const end = parseTimeToMinutes(block.end_time);
  if (start === null || end === null) return 0;
  return Math.max(0, end - start);
}

function dayOfWeekFromDate(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getDay();
}

function hourFromTime(time: string | null | undefined): number {
  const mins = parseTimeToMinutes(time);
  if (mins === null) return 0;
  return Math.floor(mins / 60);
}

export async function getTenantSchedule(
  tenantId: string,
  range: ScheduleRange,
  filter?: { locationId?: string | null },
): Promise<ScheduleBlock[]> {
  const locationId = filter?.locationId?.trim();
  return listScheduleBlocks(
    tenantId,
    {
      date_from: range.start,
      date_to: range.end,
      ...(locationId ? { location_id: locationId } : {}),
    },
    { limit: 5000 },
  );
}

export async function getLocationSchedule(
  locationId: string,
  tenantId: string,
  range: ScheduleRange,
): Promise<ScheduleBlock[]> {
  if (!locationId) return [];
  return listScheduleBlocks(
    tenantId,
    {
      location_id: locationId,
      date_from: range.start,
      date_to: range.end,
    },
    { limit: 5000 },
  );
}

export async function getTeacherAvailability(
  teacherId: string,
  tenantId: string,
  range: ScheduleRange,
): Promise<TeacherAvailability> {
  const blocks = await listScheduleBlocks(
    tenantId,
    { teacher_id: teacherId, date_from: range.start, date_to: range.end },
    { limit: 5000 },
  );

  const bucketMap = new Map<string, TeacherAvailabilityBucket>();
  let totalMinutes = 0;
  for (const b of blocks) {
    if (!b.block_date) continue;
    const dow = dayOfWeekFromDate(b.block_date);
    const hour = hourFromTime(b.start_time);
    const mins = durationMinutes(b);
    totalMinutes += mins;
    const key = `${dow}:${hour}`;
    const existing = bucketMap.get(key);
    if (existing) {
      existing.blockCount += 1;
      existing.totalMinutes += mins;
    } else {
      bucketMap.set(key, {
        dayOfWeek: dow,
        hour,
        blockCount: 1,
        totalMinutes: mins,
      });
    }
  }

  const weeklyHours = totalMinutes / 60;
  const maxWeeklyHours = 40;
  const utilizationPct = Math.min(
    100,
    Math.round((weeklyHours / maxWeeklyHours) * 100),
  );

  return {
    teacherId,
    tenantId,
    range,
    totalBlocks: blocks.length,
    totalMinutes,
    buckets: Array.from(bucketMap.values()),
    weeklyHours,
    utilizationPct,
  };
}

export async function getRoomAvailability(
  roomId: string,
  tenantId: string,
  range: ScheduleRange,
): Promise<RoomAvailability> {
  const blocks = await listScheduleBlocks(
    tenantId,
    { room_id: roomId, date_from: range.start, date_to: range.end },
    { limit: 5000 },
  );

  const bucketMap = new Map<string, RoomAvailabilityBucket>();
  let totalMinutes = 0;
  for (const b of blocks) {
    if (!b.block_date) continue;
    const dow = dayOfWeekFromDate(b.block_date);
    const hour = hourFromTime(b.start_time);
    const mins = durationMinutes(b);
    totalMinutes += mins;
    const key = `${dow}:${hour}`;
    const existing = bucketMap.get(key);
    if (existing) {
      existing.blockCount += 1;
      existing.totalMinutes += mins;
    } else {
      bucketMap.set(key, {
        dayOfWeek: dow,
        hour,
        blockCount: 1,
        totalMinutes: mins,
      });
    }
  }

  const maxMinutesInWindow = 7 * 24 * 60;
  const utilizationPct = Math.min(
    100,
    Math.round((totalMinutes / maxMinutesInWindow) * 100),
  );

  return {
    roomId,
    tenantId,
    range,
    totalBlocks: blocks.length,
    totalMinutes,
    buckets: Array.from(bucketMap.values()),
    utilizationPct,
  };
}

export async function detectConflicts(
  tenantId: string,
  range: ScheduleRange,
): Promise<ConflictItem[]> {
  const blocks = await getTenantSchedule(tenantId, range);
  return computeConflicts(blocks);
}

export function computeConflicts(blocks: ScheduleBlock[]): ConflictItem[] {
  const byDate = new Map<string, ScheduleBlock[]>();
  for (const b of blocks) {
    if (!b.block_date) continue;
    const arr = byDate.get(b.block_date) ?? [];
    arr.push(b);
    byDate.set(b.block_date, arr);
  }

  const conflicts: ConflictItem[] = [];
  for (const [date, list] of byDate.entries()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aStart = parseTimeToMinutes(a.start_time);
        const aEnd = parseTimeToMinutes(a.end_time);
        const bStart = parseTimeToMinutes(b.start_time);
        const bEnd = parseTimeToMinutes(b.end_time);
        if (aStart === null || aEnd === null || bStart === null || bEnd === null)
          continue;
        const overlap = aStart < bEnd && bStart < aEnd;
        if (!overlap) continue;

        const sameTeacher =
          !!a.teacher_id && !!b.teacher_id && a.teacher_id === b.teacher_id;
        const sameRoom =
          !!a.room_id && !!b.room_id && a.room_id === b.room_id;
        const sameStudent =
          !!a.student_id && !!b.student_id && a.student_id === b.student_id;

        if (sameTeacher) {
          conflicts.push({
            id: `${a.id}__${b.id}__teacher`,
            kind: "teacher_overlap",
            blockDate: date,
            startTime: a.start_time,
            endTime: a.end_time,
            teacherId: a.teacher_id,
            roomId: a.room_id ?? null,
            studentId: a.student_id ?? null,
            locationId: a.location_id ?? null,
            conflictWithBlockIds: [a.id, b.id],
            reason: "Teacher double-booked",
          });
        }
        if (sameRoom) {
          conflicts.push({
            id: `${a.id}__${b.id}__room`,
            kind: "room_overlap",
            blockDate: date,
            startTime: a.start_time,
            endTime: a.end_time,
            teacherId: a.teacher_id ?? null,
            roomId: a.room_id,
            studentId: a.student_id ?? null,
            locationId: a.location_id ?? null,
            conflictWithBlockIds: [a.id, b.id],
            reason: "Room double-booked",
          });
        }
        if (sameStudent) {
          conflicts.push({
            id: `${a.id}__${b.id}__student`,
            kind: "student_overlap",
            blockDate: date,
            startTime: a.start_time,
            endTime: a.end_time,
            teacherId: a.teacher_id ?? null,
            roomId: a.room_id ?? null,
            studentId: a.student_id,
            locationId: a.location_id ?? null,
            conflictWithBlockIds: [a.id, b.id],
            reason: "Student double-booked",
          });
        }
      }
    }
  }
  return conflicts;
}

export type SuggestScheduleInput = {
  teacherId?: string;
  studentId?: string;
  roomId?: string;
  duration: number;
  range?: ScheduleRange;
  limit?: number;
};

const DEFAULT_SUGGEST_DAY_START = 9 * 60;
const DEFAULT_SUGGEST_DAY_END = 20 * 60;

function addDaysStr(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function enumerateDates(range: ScheduleRange): string[] {
  const out: string[] = [];
  let cursor = range.start;
  const guard = 60;
  let i = 0;
  while (cursor <= range.end && i < guard) {
    out.push(cursor);
    cursor = addDaysStr(cursor, 1);
    i += 1;
  }
  return out;
}

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function suggestSchedule(
  tenantId: string,
  input: SuggestScheduleInput,
): Promise<SuggestedSlot[]> {
  const now = new Date();
  const defaultStart = now.toISOString().slice(0, 10);
  const defaultEnd = new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const range: ScheduleRange = input.range ?? {
    start: defaultStart,
    end: defaultEnd,
  };

  const duration = Math.max(15, Math.min(240, input.duration || 30));
  const limit = Math.max(1, Math.min(50, input.limit ?? 8));

  const [teachers, rooms, blocks] = await Promise.all([
    listTeachers(tenantId, {}, { limit: 1000 }),
    listRooms(tenantId, { is_active: true }, { limit: 1000 }),
    getTenantSchedule(tenantId, range),
  ]);

  const candidateTeachers = input.teacherId
    ? teachers.filter((t) => t.id === input.teacherId)
    : teachers;
  const candidateRooms = input.roomId
    ? rooms.filter((r) => r.id === input.roomId)
    : rooms;

  const blocksByTeacher = new Map<string, ScheduleBlock[]>();
  const blocksByRoom = new Map<string, ScheduleBlock[]>();
  for (const b of blocks) {
    if (b.teacher_id) {
      const arr = blocksByTeacher.get(b.teacher_id) ?? [];
      arr.push(b);
      blocksByTeacher.set(b.teacher_id, arr);
    }
    if (b.room_id) {
      const arr = blocksByRoom.get(b.room_id) ?? [];
      arr.push(b);
      blocksByRoom.set(b.room_id, arr);
    }
  }

  const dates = enumerateDates(range);
  const out: SuggestedSlot[] = [];

  for (const teacher of candidateTeachers) {
    const teacherBlocks = blocksByTeacher.get(teacher.id) ?? [];
    for (const date of dates) {
      const dayTeacherBlocks = teacherBlocks.filter((b) => b.block_date === date);

      for (
        let start = DEFAULT_SUGGEST_DAY_START;
        start + duration <= DEFAULT_SUGGEST_DAY_END;
        start += 30
      ) {
        const end = start + duration;

        const teacherBusy = dayTeacherBlocks.some((b) => {
          const s = parseTimeToMinutes(b.start_time);
          const e = parseTimeToMinutes(b.end_time);
          if (s === null || e === null) return false;
          return overlaps(start, end, s, e);
        });
        if (teacherBusy) continue;

        let chosenRoom: Room | null = null;
        for (const room of candidateRooms) {
          const roomBlocks = blocksByRoom.get(room.id) ?? [];
          const roomBusy = roomBlocks.some((b) => {
            if (b.block_date !== date) return false;
            const s = parseTimeToMinutes(b.start_time);
            const e = parseTimeToMinutes(b.end_time);
            if (s === null || e === null) return false;
            return overlaps(start, end, s, e);
          });
          if (!roomBusy) {
            chosenRoom = room;
            break;
          }
        }
        if (candidateRooms.length > 0 && !chosenRoom) continue;

        const loadScore = Math.max(0, 100 - dayTeacherBlocks.length * 10);
        const hour = Math.floor(start / 60);
        const timeScore =
          hour >= 15 && hour <= 19 ? 100 : hour >= 10 && hour <= 14 ? 70 : 50;
        const score = Math.round(loadScore * 0.6 + timeScore * 0.4);

        out.push({
          teacherId: teacher.id,
          roomId: chosenRoom?.id ?? null,
          blockDate: date,
          startTime: minutesToClock(start),
          endTime: minutesToClock(end),
          durationMinutes: duration,
          score,
          rationale: chosenRoom
            ? `Teacher free · Room ${chosenRoom.name ?? chosenRoom.id} available`
            : "Teacher free · no room required",
        });

        if (out.length >= limit * 4) break;
      }
      if (out.length >= limit * 4) break;
    }
    if (out.length >= limit * 4) break;
  }

  out.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.blockDate !== b.blockDate) return a.blockDate < b.blockDate ? -1 : 1;
    return a.startTime < b.startTime ? -1 : 1;
  });

  return out.slice(0, limit);
}

export async function loadSchedulingBase(
  tenantId: string,
  range: ScheduleRange,
): Promise<{
  blocks: ScheduleBlock[];
  teachers: Teacher[];
  rooms: Room[];
  students: Student[];
}> {
  const [blocks, teachers, rooms, students] = await Promise.all([
    getTenantSchedule(tenantId, range),
    listTeachers(tenantId, {}, { limit: 1000 }),
    listRooms(tenantId, {}, { limit: 1000 }),
    listStudents(tenantId, {}, { limit: 2000 }),
  ]);
  return { blocks, teachers, rooms, students };
}
