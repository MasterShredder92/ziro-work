/**
 * Scheduling OS integration for CRM. Exposes light read helpers that
 * map a student/teacher to their schedule_blocks and teacher assignment.
 */
import { clientFor } from "@data/_client";
import { summarizeNextLesson } from "./scheduleReadouts";
export async function getStudentSchedule(tenantId, studentId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("student_id", studentId)
        .limit(200);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []).map((r) => {
        var _a, _b, _c, _d, _e, _f, _g;
        return ({
            blockId: r.id,
            dayOfWeek: (_a = r.day_of_week) !== null && _a !== void 0 ? _a : null,
            startsAt: (_b = r.start_time) !== null && _b !== void 0 ? _b : null,
            endsAt: (_c = r.end_time) !== null && _c !== void 0 ? _c : null,
            teacherId: (_d = r.teacher_id) !== null && _d !== void 0 ? _d : null,
            teacherName: null,
            roomId: (_e = r.room_id) !== null && _e !== void 0 ? _e : null,
            locationId: (_f = r.location_id) !== null && _f !== void 0 ? _f : null,
            status: (_g = r.status) !== null && _g !== void 0 ? _g : null,
        });
    });
}
export async function getTeacherSchedule(tenantId, teacherId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("teacher_id", teacherId)
        .limit(500);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []).map((r) => {
        var _a, _b, _c, _d, _e, _f, _g;
        return ({
            blockId: r.id,
            dayOfWeek: (_a = r.day_of_week) !== null && _a !== void 0 ? _a : null,
            startsAt: (_b = r.start_time) !== null && _b !== void 0 ? _b : null,
            endsAt: (_c = r.end_time) !== null && _c !== void 0 ? _c : null,
            teacherId: (_d = r.teacher_id) !== null && _d !== void 0 ? _d : null,
            teacherName: null,
            roomId: (_e = r.room_id) !== null && _e !== void 0 ? _e : null,
            locationId: (_f = r.location_id) !== null && _f !== void 0 ? _f : null,
            status: (_g = r.status) !== null && _g !== void 0 ? _g : null,
        });
    });
}
/**
 * Batch-read schedule blocks for many students; returns one “next lesson” label per student id.
 */
export async function batchNextLessonSummariesForStudents(tenantId, studentIds) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const out = {};
    if (studentIds.length === 0)
        return out;
    for (const id of studentIds)
        out[id] = null;
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("student_id", studentIds)
        .limit(2000);
    if (error)
        throw error;
    const byStudent = {};
    for (const id of studentIds)
        byStudent[id] = [];
    for (const r of data !== null && data !== void 0 ? data : []) {
        const sid = r.student_id;
        if (!sid || !byStudent[sid])
            continue;
        byStudent[sid].push({
            blockId: r.id,
            dayOfWeek: (_a = r.day_of_week) !== null && _a !== void 0 ? _a : null,
            startsAt: (_b = r.start_time) !== null && _b !== void 0 ? _b : null,
            endsAt: (_c = r.end_time) !== null && _c !== void 0 ? _c : null,
            teacherId: (_d = r.teacher_id) !== null && _d !== void 0 ? _d : null,
            teacherName: null,
            roomId: (_e = r.room_id) !== null && _e !== void 0 ? _e : null,
            locationId: (_f = r.location_id) !== null && _f !== void 0 ? _f : null,
            status: (_g = r.status) !== null && _g !== void 0 ? _g : null,
        });
    }
    for (const id of studentIds) {
        out[id] = summarizeNextLesson((_h = byStudent[id]) !== null && _h !== void 0 ? _h : []);
    }
    return out;
}
/**
 * One-line schedule summary for a teacher (earliest weekday block).
 */
export async function summarizeTeacherScheduleHeadline(tenantId, teacherId) {
    const rows = await getTeacherSchedule(tenantId, teacherId);
    return summarizeNextLesson(rows);
}
/** One recurring-style headline per teacher (for CRM roster). */
export async function batchTeacherScheduleHeadlines(tenantId, teacherIds) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const out = {};
    if (teacherIds.length === 0)
        return out;
    for (const id of teacherIds)
        out[id] = null;
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("schedule_blocks")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("teacher_id", teacherIds)
        .limit(3000);
    if (error)
        throw error;
    const byTeacher = {};
    for (const id of teacherIds)
        byTeacher[id] = [];
    for (const r of data !== null && data !== void 0 ? data : []) {
        const tid = r.teacher_id;
        if (!tid || !byTeacher[tid])
            continue;
        byTeacher[tid].push({
            blockId: r.id,
            dayOfWeek: (_a = r.day_of_week) !== null && _a !== void 0 ? _a : null,
            startsAt: (_b = r.start_time) !== null && _b !== void 0 ? _b : null,
            endsAt: (_c = r.end_time) !== null && _c !== void 0 ? _c : null,
            teacherId: (_d = r.teacher_id) !== null && _d !== void 0 ? _d : null,
            teacherName: null,
            roomId: (_e = r.room_id) !== null && _e !== void 0 ? _e : null,
            locationId: (_f = r.location_id) !== null && _f !== void 0 ? _f : null,
            status: (_g = r.status) !== null && _g !== void 0 ? _g : null,
        });
    }
    for (const id of teacherIds) {
        out[id] = summarizeNextLesson((_h = byTeacher[id]) !== null && _h !== void 0 ? _h : []);
    }
    return out;
}
export async function assignTeacherToStudent(tenantId, studentId, teacherId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from("students")
        .update({
        teacher_id: teacherId,
        teacher_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })
        .eq("tenant_id", tenantId)
        .eq("id", studentId);
    if (error)
        throw error;
}
/**
 * Next upcoming lesson per student from `schedule_blocks.block_date` (read-only).
 */
export async function getNextLessonLabelsForStudents(tenantId, studentIds) {
    var _a, _b;
    const out = {};
    if (studentIds.length === 0)
        return out;
    const supabase = clientFor(tenantId);
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
        .from("schedule_blocks")
        .select("student_id, block_date, start_time, end_time, status")
        .eq("tenant_id", tenantId)
        .in("student_id", studentIds)
        .gte("block_date", today)
        .order("block_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(500);
    if (error)
        throw error;
    for (const row of data !== null && data !== void 0 ? data : []) {
        const sid = row.student_id;
        if (!sid || out[sid])
            continue;
        const d = row.block_date;
        const st = (_a = row.start_time) !== null && _a !== void 0 ? _a : "";
        const en = (_b = row.end_time) !== null && _b !== void 0 ? _b : "";
        out[sid] = en ? `${d} · ${st}–${en}` : `${d} · ${st || "—"}`;
    }
    return out;
}
