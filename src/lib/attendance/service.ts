import "server-only";
import { listScheduleBlocks, getScheduleBlockById } from "@data/scheduleBlocks";
import { listStudents, getStudentById } from "@data/students";
import {
  findRecordForStudentInSession,
  getAttendanceRecordById,
  upsertAttendanceRecord,
  type AttendanceRecordRow,
  type AttendanceStatus,
  type UpsertAttendanceRecordInput,
} from "@data/attendanceRecords";
import {
  findSessionByBlockAndDate,
  getAttendanceSessionById,
  listAttendanceSessions,
  upsertAttendanceSession,
  type AttendanceSessionRow,
  type UpsertAttendanceSessionInput,
} from "@data/attendanceSessions";
import {
  defaultAttendanceReasons,
  listAttendanceReasons,
  upsertAttendanceReason,
  type AttendanceReasonRow,
} from "@data/attendanceReasons";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import type { ScheduleBlock, Student } from "@/lib/types/entities";

import {
  getStudentAttendanceSummary,
  listAttendance,
} from "./queries";
import type {
  AttendanceDashboardData,
  AttendanceKpis,
  AttendanceRecord,
  AttendanceSession,
  AttendanceSessionWithRoster,
  AttendanceStudentRow,
  AttendanceSummary,
} from "./types";

export type MarkInput = {
  tenantId: string;
  sessionId: string;
  studentId: string;
  markedBy?: string | null;
  arrivedAt?: string | null;
  leftAt?: string | null;
  minutesLate?: number | null;
  reasonId?: string | null;
  reasonText?: string | null;
  notes?: string | null;
  scheduleBlockId?: string | null;
  teacherId?: string | null;
};

async function ensureSession(
  tenantId: string,
  sessionId: string,
): Promise<AttendanceSessionRow> {
  const session = await getAttendanceSessionById(sessionId, tenantId);
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.tenant_id !== tenantId) throw new Error("FORBIDDEN");
  return session;
}

function basePayload(
  session: AttendanceSessionRow,
  input: MarkInput,
): Partial<UpsertAttendanceRecordInput> {
  return {
    tenant_id: input.tenantId,
    session_id: session.id,
    student_id: input.studentId,
    schedule_block_id: input.scheduleBlockId ?? session.schedule_block_id ?? null,
    teacher_id: input.teacherId ?? session.teacher_id ?? null,
    marked_by: input.markedBy ?? null,
    arrived_at: input.arrivedAt ?? null,
    left_at: input.leftAt ?? null,
    minutes_late: input.minutesLate ?? null,
    reason_id: input.reasonId ?? null,
    reason_text: input.reasonText ?? null,
    notes: input.notes ?? null,
  };
}

async function markWithStatus(
  input: MarkInput,
  status: AttendanceStatus,
): Promise<AttendanceRecordRow> {
  await assertTenantAccess(input.tenantId);
  const session = await ensureSession(input.tenantId, input.sessionId);
  const existing = await findRecordForStudentInSession(
    input.tenantId,
    session.id,
    input.studentId,
  );

  const payload: UpsertAttendanceRecordInput = {
    ...(existing ? { id: existing.id, created_at: existing.created_at } : {}),
    ...basePayload(session, input),
    status,
    is_excused: status === "excused",
    marked_at: new Date().toISOString(),
  } as UpsertAttendanceRecordInput;

  const row = await upsertAttendanceRecord(payload);
  await logAudit("attendance.mark", {
    tenantId: input.tenantId,
    sessionId: session.id,
    studentId: input.studentId,
    status,
    recordId: row.id,
  });
  return row;
}

export async function markPresent(input: MarkInput): Promise<AttendanceRecordRow> {
  return markWithStatus(input, "present");
}

export async function markAbsent(input: MarkInput): Promise<AttendanceRecordRow> {
  return markWithStatus(input, "absent");
}

export async function markTardy(input: MarkInput): Promise<AttendanceRecordRow> {
  return markWithStatus(input, "tardy");
}

export async function markExcused(input: MarkInput): Promise<AttendanceRecordRow> {
  return markWithStatus(input, "excused");
}

export async function markMakeup(input: MarkInput): Promise<AttendanceRecordRow> {
  return markWithStatus(input, "makeup");
}

export async function markNoShow(input: MarkInput): Promise<AttendanceRecordRow> {
  return markWithStatus(input, "no_show");
}

export async function addReason(args: {
  tenantId: string;
  recordId: string;
  reasonId?: string | null;
  reasonText?: string | null;
  markedBy?: string | null;
}): Promise<AttendanceRecordRow> {
  await assertTenantAccess(args.tenantId);
  const existing = await getAttendanceRecordById(args.recordId, args.tenantId);
  if (!existing) throw new Error("RECORD_NOT_FOUND");
  const updated = await upsertAttendanceRecord({
    ...existing,
    reason_id: args.reasonId ?? existing.reason_id,
    reason_text: args.reasonText ?? existing.reason_text,
    marked_by: args.markedBy ?? existing.marked_by,
  });
  await logAudit("attendance.reason_added", {
    tenantId: args.tenantId,
    recordId: args.recordId,
    reasonId: updated.reason_id,
  });
  return updated;
}

export type OverrideInput = {
  tenantId: string;
  recordId: string;
  status: AttendanceStatus;
  reasonText: string;
  markedBy?: string | null;
  minutesLate?: number | null;
  arrivedAt?: string | null;
  leftAt?: string | null;
  notes?: string | null;
};

/**
 * Create an override record that supersedes an existing attendance record.
 * The new record stores `override_of = originalId` and `override_reason`.
 * Queries resolve the most recent non-overridden record as the canonical one.
 */
export async function overrideRecord(
  input: OverrideInput,
): Promise<AttendanceRecordRow> {
  await assertTenantAccess(input.tenantId);
  const original = await getAttendanceRecordById(input.recordId, input.tenantId);
  if (!original) throw new Error("RECORD_NOT_FOUND");

  const override = await upsertAttendanceRecord({
    tenant_id: input.tenantId,
    session_id: original.session_id,
    student_id: original.student_id,
    schedule_block_id: original.schedule_block_id,
    teacher_id: original.teacher_id,
    status: input.status,
    arrived_at: input.arrivedAt ?? original.arrived_at,
    left_at: input.leftAt ?? original.left_at,
    minutes_late: input.minutesLate ?? original.minutes_late,
    reason_id: original.reason_id,
    reason_text: original.reason_text,
    is_excused: input.status === "excused",
    marked_by: input.markedBy ?? null,
    marked_at: new Date().toISOString(),
    override_of: original.id,
    override_reason: input.reasonText,
    notes: input.notes ?? original.notes,
  });

  await logAudit("attendance.override", {
    tenantId: input.tenantId,
    originalRecordId: original.id,
    newRecordId: override.id,
    status: input.status,
    reason: input.reasonText,
  });
  return override;
}

/**
 * Ensure the default attendance reasons exist for a tenant. Only inserts missing labels.
 */
export async function ensureDefaultReasons(tenantId: string): Promise<AttendanceReasonRow[]> {
  const existing = await listAttendanceReasons({}, tenantId, { limit: 200 });
  const existingCodes = new Set(existing.map((r) => r.code.toLowerCase()));
  const toCreate = defaultAttendanceReasons(tenantId).filter(
    (r) => !existingCodes.has(r.code.toLowerCase()),
  );
  const created: AttendanceReasonRow[] = [];
  for (const r of toCreate) {
    const row = await upsertAttendanceReason({
      tenant_id: tenantId,
      code: r.code,
      label: r.label,
      category: r.category,
      is_excused: r.is_excused,
      is_active: true,
      sort_order: r.sort_order ?? null,
    });
    created.push(row);
  }
  return [...existing, ...created];
}

/**
 * Auto-generate attendance sessions from Scheduling OS `schedule_blocks` in a date window.
 * Idempotent: existing sessions for a given (block, date) are skipped.
 */
export async function generateSessionsFromSchedule(
  tenantId: string,
  range: { start: string; end: string },
  filter?: { teacherId?: string; locationId?: string; roomId?: string },
): Promise<{ created: AttendanceSessionRow[]; skipped: number }> {
  await assertTenantAccess(tenantId);

  const blocks = await listScheduleBlocks(
    tenantId,
    {
      date_from: range.start,
      date_to: range.end,
      ...(filter?.teacherId ? { teacher_id: filter.teacherId } : {}),
      ...(filter?.locationId ? { location_id: filter.locationId } : {}),
      ...(filter?.roomId ? { room_id: filter.roomId } : {}),
    },
    { limit: 5000 },
  );

  const created: AttendanceSessionRow[] = [];
  let skipped = 0;

  for (const b of blocks as ScheduleBlock[]) {
    if (!b.block_date) continue;
    const existing = await findSessionByBlockAndDate(tenantId, b.id, b.block_date);
    if (existing) {
      skipped += 1;
      continue;
    }
    const payload: UpsertAttendanceSessionInput = {
      tenant_id: tenantId,
      schedule_block_id: b.id,
      session_date: b.block_date,
      start_time: b.start_time ?? null,
      end_time: b.end_time ?? null,
      teacher_id: b.teacher_id ?? null,
      location_id: b.location_id ?? null,
      room_id: b.room_id ?? null,
      class_label: null,
      status: "scheduled",
    };
    const session = await upsertAttendanceSession(payload);
    created.push(session);
  }

  if (created.length > 0) {
    await logAudit("attendance.sessions_generated", {
      tenantId,
      createdCount: created.length,
      skipped,
      range,
    });
  }
  return { created, skipped };
}

/**
 * Resolve a session's roster (all students linked via schedule block), plus existing records.
 */
export async function getSessionWithRoster(
  sessionId: string,
  tenantId: string,
): Promise<AttendanceSessionWithRoster | null> {
  await assertTenantAccess(tenantId);
  const session = await getAttendanceSessionById(sessionId, tenantId);
  if (!session) return null;

  const [records, allStudents] = await Promise.all([
    (async () => {
      const { records: rs } = await listAttendance(
        "__all__",
        null,
        tenantId,
      ).catch(() => ({ records: [] as AttendanceRecord[], sessions: [] }));
      return rs.filter((r) => r.session_id === session.id);
    })(),
    listStudents(tenantId, {}, { limit: 2000 }),
  ]);

  const studentIds = new Set<string>();
  if (session.schedule_block_id) {
    const block = await getScheduleBlockById(
      session.schedule_block_id,
      tenantId,
    ).catch(() => null);
    if (block?.student_id) studentIds.add(block.student_id);
  }
  for (const r of records) studentIds.add(r.student_id);

  const roster: Student[] = allStudents.filter((s) => studentIds.has(s.id));

  return {
    ...session,
    records,
    students: roster,
    teacher: null,
  };
}

/**
 * Build the attendance dashboard for a tenant over a date window.
 */
export async function getAttendanceDashboard(
  tenantId: string,
  range?: { start: string; end: string },
): Promise<AttendanceDashboardData> {
  await assertTenantAccess(tenantId);

  const today = new Date();
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const defaultEnd = today.toISOString().slice(0, 10);
  const windowStart = range?.start ?? defaultStart;
  const windowEnd = range?.end ?? defaultEnd;

  const [students, upcomingSessions] = await Promise.all([
    listStudents(tenantId, {}, { limit: 500 }),
    listAttendanceSessions(
      { date_from: windowStart, date_to: windowEnd },
      tenantId,
      { limit: 100 },
    ),
  ]);

  const sampled = students.slice(0, 200);
  const summaries: AttendanceStudentRow[] = await Promise.all(
    sampled.map(async (s): Promise<AttendanceStudentRow> => {
      const summary = await getStudentAttendanceSummary(s.id, tenantId, {
        start: windowStart,
        end: windowEnd,
      });
      return { student: s, summary };
    }),
  );

  const totals: AttendanceKpis = summaries.reduce<AttendanceKpis>(
    (acc, row) => ({
      totalRecords: acc.totalRecords + row.summary.kpis.totalRecords,
      presentCount: acc.presentCount + row.summary.kpis.presentCount,
      absentCount: acc.absentCount + row.summary.kpis.absentCount,
      tardyCount: acc.tardyCount + row.summary.kpis.tardyCount,
      excusedCount: acc.excusedCount + row.summary.kpis.excusedCount,
      makeupCount: acc.makeupCount + row.summary.kpis.makeupCount,
      noShowCount: acc.noShowCount + row.summary.kpis.noShowCount,
      attendanceRate: acc.attendanceRate,
      punctualityRate: acc.punctualityRate,
    }),
    {
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      tardyCount: 0,
      excusedCount: 0,
      makeupCount: 0,
      noShowCount: 0,
      attendanceRate: 0,
      punctualityRate: 0,
    },
  );
  if (totals.totalRecords > 0) {
    const attended =
      totals.presentCount +
      totals.tardyCount +
      totals.makeupCount +
      totals.excusedCount;
    totals.attendanceRate = Math.round((attended / totals.totalRecords) * 100);
    const punctBase = totals.presentCount + totals.tardyCount;
    totals.punctualityRate =
      punctBase === 0
        ? 0
        : Math.round((totals.presentCount / punctBase) * 100);
  }

  const atRisk = summaries
    .filter((s) => s.summary.riskLevel === "high" || s.summary.riskLevel === "critical")
    .sort((a, b) => b.summary.riskScore - a.summary.riskScore)
    .slice(0, 20);

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    windowStart,
    windowEnd,
    totals,
    students: summaries,
    upcomingSessions: upcomingSessions as AttendanceSessionRow[] as AttendanceSession[],
    atRisk,
  };
}

/**
 * Get a single student's attendance page data: student + summary + records + sessions.
 */
export async function getStudentAttendancePageData(
  studentId: string,
  tenantId: string,
  range?: { start: string; end: string },
): Promise<{
  student: Student | null;
  summary: AttendanceSummary;
  records: AttendanceRecord[];
  sessions: AttendanceSession[];
}> {
  await assertTenantAccess(tenantId);
  const [student, summary, combined] = await Promise.all([
    getStudentById(studentId, tenantId),
    getStudentAttendanceSummary(studentId, tenantId, range),
    listAttendance(studentId, range ?? null, tenantId),
  ]);
  return {
    student: student as Student | null,
    summary,
    records: combined.records,
    sessions: combined.sessions,
  };
}
