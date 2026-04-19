import {
  computeConflicts,
  getLocationSchedule,
  getRoomAvailability,
  getTeacherAvailability,
  loadSchedulingBase,
  suggestSchedule,
} from "./queries";
import type {
  ConflictItem,
  ScheduleRange,
  SchedulingDashboardData,
} from "./types";
import type { ScheduleBlock } from "@/lib/types/entities";

function defaultRange(): ScheduleRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function getSchedulingDashboard(
  tenantId: string,
  range?: ScheduleRange,
): Promise<SchedulingDashboardData> {
  const resolvedRange = range ?? defaultRange();

  const base = await loadSchedulingBase(tenantId, resolvedRange);
  const conflicts = computeConflicts(base.blocks);

  const [teacherAvailability, roomAvailability, suggestions] = await Promise.all([
    Promise.all(
      base.teachers.slice(0, 50).map((t) =>
        getTeacherAvailability(t.id, tenantId, resolvedRange),
      ),
    ),
    Promise.all(
      base.rooms.slice(0, 50).map((r) =>
        getRoomAvailability(r.id, tenantId, resolvedRange),
      ),
    ),
    suggestSchedule(tenantId, { duration: 30, range: resolvedRange, limit: 8 }),
  ]);

  const totalMinutes = teacherAvailability.reduce(
    (sum, t) => sum + t.totalMinutes,
    0,
  );

  return {
    tenantId,
    range: resolvedRange,
    generatedAt: new Date().toISOString(),
    blocks: base.blocks,
    teachers: base.teachers,
    rooms: base.rooms,
    students: base.students,
    conflicts,
    teacherAvailability,
    roomAvailability,
    suggestions,
    kpis: {
      totalBlocks: base.blocks.length,
      totalTeachers: base.teachers.length,
      totalRooms: base.rooms.length,
      totalStudents: base.students.length,
      conflictsCount: conflicts.length,
      weeklyLessonHours: Math.round((totalMinutes / 60) * 10) / 10,
    },
  };
}

function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function blockDurationMinutes(b: ScheduleBlock): number {
  const s = parseTimeToMinutes(b.start_time);
  const e = parseTimeToMinutes(b.end_time);
  if (s === null || e === null) return 0;
  return Math.max(0, e - s);
}

export type LocationSchedulingSummary = {
  locationId: string;
  tenantId: string;
  range: ScheduleRange;
  blocks: ScheduleBlock[];
  totalBlocks: number;
  totalMinutes: number;
  weeklyHours: number;
  uniqueTeacherCount: number;
  uniqueRoomCount: number;
  uniqueStudentCount: number;
  conflicts: ConflictItem[];
  generatedAt: string;
};

export async function getLocationSchedulingSummary(
  tenantId: string,
  locationId: string,
  range?: ScheduleRange,
): Promise<LocationSchedulingSummary> {
  const resolvedRange = range ?? defaultRange();
  const blocks = await getLocationSchedule(locationId, tenantId, resolvedRange);
  const conflicts = computeConflicts(blocks);

  const totalMinutes = blocks.reduce(
    (sum, b) => sum + blockDurationMinutes(b),
    0,
  );

  const teacherIds = new Set<string>();
  const roomIds = new Set<string>();
  const studentIds = new Set<string>();
  for (const b of blocks) {
    if (b.teacher_id) teacherIds.add(b.teacher_id);
    if (b.room_id) roomIds.add(b.room_id);
    if (b.student_id) studentIds.add(b.student_id);
  }

  return {
    locationId,
    tenantId,
    range: resolvedRange,
    blocks,
    totalBlocks: blocks.length,
    totalMinutes,
    weeklyHours: Math.round((totalMinutes / 60) * 10) / 10,
    uniqueTeacherCount: teacherIds.size,
    uniqueRoomCount: roomIds.size,
    uniqueStudentCount: studentIds.size,
    conflicts,
    generatedAt: new Date().toISOString(),
  };
}
