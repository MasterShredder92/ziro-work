import "server-only";
import { listScheduleBlocks, getScheduleBlockById } from "@data/scheduleBlocks";
import { listStudents, getStudentById } from "@data/students";
import { findRecordForStudentInSession, getAttendanceRecordById, upsertAttendanceRecord, } from "@data/attendanceRecords";
import { findSessionByBlockAndDate, getAttendanceSessionById, listAttendanceSessions, upsertAttendanceSession, } from "@data/attendanceSessions";
import { defaultAttendanceReasons, listAttendanceReasons, upsertAttendanceReason, } from "@data/attendanceReasons";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getStudentAttendanceSummary, listAttendance, } from "./queries";
async function ensureSession(tenantId, sessionId) {
    const session = await getAttendanceSessionById(sessionId, tenantId);
    if (!session)
        throw new Error("SESSION_NOT_FOUND");
    if (session.tenant_id !== tenantId)
        throw new Error("FORBIDDEN");
    return session;
}
function basePayload(session, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        tenant_id: input.tenantId,
        session_id: session.id,
        student_id: input.studentId,
        schedule_block_id: (_b = (_a = input.scheduleBlockId) !== null && _a !== void 0 ? _a : session.schedule_block_id) !== null && _b !== void 0 ? _b : null,
        teacher_id: (_d = (_c = input.teacherId) !== null && _c !== void 0 ? _c : session.teacher_id) !== null && _d !== void 0 ? _d : null,
        marked_by: (_e = input.markedBy) !== null && _e !== void 0 ? _e : null,
        arrived_at: (_f = input.arrivedAt) !== null && _f !== void 0 ? _f : null,
        left_at: (_g = input.leftAt) !== null && _g !== void 0 ? _g : null,
        minutes_late: (_h = input.minutesLate) !== null && _h !== void 0 ? _h : null,
        reason_id: (_j = input.reasonId) !== null && _j !== void 0 ? _j : null,
        reason_text: (_k = input.reasonText) !== null && _k !== void 0 ? _k : null,
        notes: (_l = input.notes) !== null && _l !== void 0 ? _l : null,
    };
}
async function markWithStatus(input, status) {
    await assertTenantAccess(input.tenantId);
    const session = await ensureSession(input.tenantId, input.sessionId);
    const existing = await findRecordForStudentInSession(input.tenantId, session.id, input.studentId);
    const payload = Object.assign(Object.assign(Object.assign({}, (existing ? { id: existing.id, created_at: existing.created_at } : {})), basePayload(session, input)), { status, is_excused: status === "excused", marked_at: new Date().toISOString() });
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
export async function markPresent(input) {
    return markWithStatus(input, "present");
}
export async function markAbsent(input) {
    return markWithStatus(input, "absent");
}
export async function markTardy(input) {
    return markWithStatus(input, "tardy");
}
export async function markExcused(input) {
    return markWithStatus(input, "excused");
}
export async function markMakeup(input) {
    return markWithStatus(input, "makeup");
}
export async function markNoShow(input) {
    return markWithStatus(input, "no_show");
}
export async function addReason(args) {
    var _a, _b, _c;
    await assertTenantAccess(args.tenantId);
    const existing = await getAttendanceRecordById(args.recordId, args.tenantId);
    if (!existing)
        throw new Error("RECORD_NOT_FOUND");
    const updated = await upsertAttendanceRecord(Object.assign(Object.assign({}, existing), { reason_id: (_a = args.reasonId) !== null && _a !== void 0 ? _a : existing.reason_id, reason_text: (_b = args.reasonText) !== null && _b !== void 0 ? _b : existing.reason_text, marked_by: (_c = args.markedBy) !== null && _c !== void 0 ? _c : existing.marked_by }));
    await logAudit("attendance.reason_added", {
        tenantId: args.tenantId,
        recordId: args.recordId,
        reasonId: updated.reason_id,
    });
    return updated;
}
/**
 * Create an override record that supersedes an existing attendance record.
 * The new record stores `override_of = originalId` and `override_reason`.
 * Queries resolve the most recent non-overridden record as the canonical one.
 */
export async function overrideRecord(input) {
    var _a, _b, _c, _d, _e;
    await assertTenantAccess(input.tenantId);
    const original = await getAttendanceRecordById(input.recordId, input.tenantId);
    if (!original)
        throw new Error("RECORD_NOT_FOUND");
    const override = await upsertAttendanceRecord({
        tenant_id: input.tenantId,
        session_id: original.session_id,
        student_id: original.student_id,
        schedule_block_id: original.schedule_block_id,
        teacher_id: original.teacher_id,
        status: input.status,
        arrived_at: (_a = input.arrivedAt) !== null && _a !== void 0 ? _a : original.arrived_at,
        left_at: (_b = input.leftAt) !== null && _b !== void 0 ? _b : original.left_at,
        minutes_late: (_c = input.minutesLate) !== null && _c !== void 0 ? _c : original.minutes_late,
        reason_id: original.reason_id,
        reason_text: original.reason_text,
        is_excused: input.status === "excused",
        marked_by: (_d = input.markedBy) !== null && _d !== void 0 ? _d : null,
        marked_at: new Date().toISOString(),
        override_of: original.id,
        override_reason: input.reasonText,
        notes: (_e = input.notes) !== null && _e !== void 0 ? _e : original.notes,
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
export async function ensureDefaultReasons(tenantId) {
    var _a;
    const existing = await listAttendanceReasons({}, tenantId, { limit: 200 });
    const existingCodes = new Set(existing.map((r) => r.code.toLowerCase()));
    const toCreate = defaultAttendanceReasons(tenantId).filter((r) => !existingCodes.has(r.code.toLowerCase()));
    const created = [];
    for (const r of toCreate) {
        const row = await upsertAttendanceReason({
            tenant_id: tenantId,
            code: r.code,
            label: r.label,
            category: r.category,
            is_excused: r.is_excused,
            is_active: true,
            sort_order: (_a = r.sort_order) !== null && _a !== void 0 ? _a : null,
        });
        created.push(row);
    }
    return [...existing, ...created];
}
/**
 * Auto-generate attendance sessions from Scheduling OS `schedule_blocks` in a date window.
 * Idempotent: existing sessions for a given (block, date) are skipped.
 */
export async function generateSessionsFromSchedule(tenantId, range, filter) {
    var _a, _b, _c, _d, _e;
    await assertTenantAccess(tenantId);
    const blocks = await listScheduleBlocks(tenantId, Object.assign(Object.assign(Object.assign({ date_from: range.start, date_to: range.end }, ((filter === null || filter === void 0 ? void 0 : filter.teacherId) ? { teacher_id: filter.teacherId } : {})), ((filter === null || filter === void 0 ? void 0 : filter.locationId) ? { location_id: filter.locationId } : {})), ((filter === null || filter === void 0 ? void 0 : filter.roomId) ? { room_id: filter.roomId } : {})), { limit: 5000 });
    const created = [];
    let skipped = 0;
    for (const b of blocks) {
        if (!b.block_date)
            continue;
        const existing = await findSessionByBlockAndDate(tenantId, b.id, b.block_date);
        if (existing) {
            skipped += 1;
            continue;
        }
        const payload = {
            tenant_id: tenantId,
            schedule_block_id: b.id,
            session_date: b.block_date,
            start_time: (_a = b.start_time) !== null && _a !== void 0 ? _a : null,
            end_time: (_b = b.end_time) !== null && _b !== void 0 ? _b : null,
            teacher_id: (_c = b.teacher_id) !== null && _c !== void 0 ? _c : null,
            location_id: (_d = b.location_id) !== null && _d !== void 0 ? _d : null,
            room_id: (_e = b.room_id) !== null && _e !== void 0 ? _e : null,
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
export async function getSessionWithRoster(sessionId, tenantId) {
    await assertTenantAccess(tenantId);
    const session = await getAttendanceSessionById(sessionId, tenantId);
    if (!session)
        return null;
    const [records, allStudents] = await Promise.all([
        (async () => {
            const { records: rs } = await listAttendance("__all__", null, tenantId).catch(() => ({ records: [], sessions: [] }));
            return rs.filter((r) => r.session_id === session.id);
        })(),
        listStudents(tenantId, {}, { limit: 2000 }),
    ]);
    const studentIds = new Set();
    if (session.schedule_block_id) {
        const block = await getScheduleBlockById(session.schedule_block_id, tenantId).catch(() => null);
        if (block === null || block === void 0 ? void 0 : block.student_id)
            studentIds.add(block.student_id);
    }
    for (const r of records)
        studentIds.add(r.student_id);
    const roster = allStudents.filter((s) => studentIds.has(s.id));
    return Object.assign(Object.assign({}, session), { records, students: roster, teacher: null });
}
/**
 * Build the attendance dashboard for a tenant over a date window.
 */
export async function getAttendanceDashboard(tenantId, range) {
    var _a, _b;
    await assertTenantAccess(tenantId);
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    const defaultEnd = today.toISOString().slice(0, 10);
    const windowStart = (_a = range === null || range === void 0 ? void 0 : range.start) !== null && _a !== void 0 ? _a : defaultStart;
    const windowEnd = (_b = range === null || range === void 0 ? void 0 : range.end) !== null && _b !== void 0 ? _b : defaultEnd;
    const [students, upcomingSessions] = await Promise.all([
        listStudents(tenantId, {}, { limit: 500 }),
        listAttendanceSessions({ date_from: windowStart, date_to: windowEnd }, tenantId, { limit: 100 }),
    ]);
    const sampled = students.slice(0, 200);
    const summaries = await Promise.all(sampled.map(async (s) => {
        const summary = await getStudentAttendanceSummary(s.id, tenantId, {
            start: windowStart,
            end: windowEnd,
        });
        return { student: s, summary };
    }));
    const totals = summaries.reduce((acc, row) => ({
        totalRecords: acc.totalRecords + row.summary.kpis.totalRecords,
        presentCount: acc.presentCount + row.summary.kpis.presentCount,
        absentCount: acc.absentCount + row.summary.kpis.absentCount,
        tardyCount: acc.tardyCount + row.summary.kpis.tardyCount,
        excusedCount: acc.excusedCount + row.summary.kpis.excusedCount,
        makeupCount: acc.makeupCount + row.summary.kpis.makeupCount,
        noShowCount: acc.noShowCount + row.summary.kpis.noShowCount,
        attendanceRate: acc.attendanceRate,
        punctualityRate: acc.punctualityRate,
    }), {
        totalRecords: 0,
        presentCount: 0,
        absentCount: 0,
        tardyCount: 0,
        excusedCount: 0,
        makeupCount: 0,
        noShowCount: 0,
        attendanceRate: 0,
        punctualityRate: 0,
    });
    if (totals.totalRecords > 0) {
        const attended = totals.presentCount +
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
        upcomingSessions: upcomingSessions,
        atRisk,
    };
}
/**
 * Get a single student's attendance page data: student + summary + records + sessions.
 */
export async function getStudentAttendancePageData(studentId, tenantId, range) {
    await assertTenantAccess(tenantId);
    const [student, summary, combined] = await Promise.all([
        getStudentById(studentId, tenantId),
        getStudentAttendanceSummary(studentId, tenantId, range),
        listAttendance(studentId, range !== null && range !== void 0 ? range : null, tenantId),
    ]);
    return {
        student: student,
        summary,
        records: combined.records,
        sessions: combined.sessions,
    };
}
