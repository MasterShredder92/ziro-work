/**
 * Scheduling OS integration for CRM. Exposes light read helpers that
 * map a student/teacher to their schedule_blocks and teacher assignment.
 */
import { clientFor } from "@data/_client";
import { summarizeNextLesson } from "./scheduleReadouts";

export type StudentScheduleEntry = {
  blockId: string;
  dayOfWeek: string | null;
  startsAt: string | null;
  endsAt: string | null;
  teacherId: string | null;
  teacherName: string | null;
  roomId: string | null;
  locationId: string | null;
  status: string | null;
};

export async function getStudentSchedule(
  tenantId: string,
  studentId: string,
): Promise<StudentScheduleEntry[]> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("student_id", studentId)
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    blockId: r.id as string,
    dayOfWeek: (r.day_of_week as string | null) ?? null,
    startsAt: (r.start_time as string | null) ?? null,
    endsAt: (r.end_time as string | null) ?? null,
    teacherId: (r.teacher_id as string | null) ?? null,
    teacherName: null,
    roomId: (r.room_id as string | null) ?? null,
    locationId: (r.location_id as string | null) ?? null,
    status: (r.status as string | null) ?? null,
  }));
}

export async function getTeacherSchedule(
  tenantId: string,
  teacherId: string,
): Promise<StudentScheduleEntry[]> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("teacher_id", teacherId)
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    blockId: r.id as string,
    dayOfWeek: (r.day_of_week as string | null) ?? null,
    startsAt: (r.start_time as string | null) ?? null,
    endsAt: (r.end_time as string | null) ?? null,
    teacherId: (r.teacher_id as string | null) ?? null,
    teacherName: null,
    roomId: (r.room_id as string | null) ?? null,
    locationId: (r.location_id as string | null) ?? null,
    status: (r.status as string | null) ?? null,
  }));
}

/**
 * Batch-read schedule blocks for many students; returns one “next lesson” label per student id.
 */
export async function batchNextLessonSummariesForStudents(
  tenantId: string,
  studentIds: string[],
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  if (studentIds.length === 0) return out;
  for (const id of studentIds) out[id] = null;
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("student_id", studentIds)
    .limit(2000);
  if (error) throw error;
  const byStudent: Record<string, StudentScheduleEntry[]> = {};
  for (const id of studentIds) byStudent[id] = [];
  for (const r of data ?? []) {
    const sid = r.student_id as string | undefined;
    if (!sid || !byStudent[sid]) continue;
    byStudent[sid].push({
      blockId: r.id as string,
      dayOfWeek: (r.day_of_week as string | null) ?? null,
      startsAt: (r.start_time as string | null) ?? null,
      endsAt: (r.end_time as string | null) ?? null,
      teacherId: (r.teacher_id as string | null) ?? null,
      teacherName: null,
      roomId: (r.room_id as string | null) ?? null,
      locationId: (r.location_id as string | null) ?? null,
      status: (r.status as string | null) ?? null,
    });
  }
  for (const id of studentIds) {
    out[id] = summarizeNextLesson(byStudent[id] ?? []);
  }
  return out;
}

/**
 * One-line schedule summary for a teacher (earliest weekday block).
 */
export async function summarizeTeacherScheduleHeadline(
  tenantId: string,
  teacherId: string,
): Promise<string | null> {
  const rows = await getTeacherSchedule(tenantId, teacherId);
  return summarizeNextLesson(rows);
}

/** One recurring-style headline per teacher (for CRM roster). */
export async function batchTeacherScheduleHeadlines(
  tenantId: string,
  teacherIds: string[],
): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  if (teacherIds.length === 0) return out;
  for (const id of teacherIds) out[id] = null;
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from("schedule_blocks")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("teacher_id", teacherIds)
    .limit(3000);
  if (error) throw error;
  const byTeacher: Record<string, StudentScheduleEntry[]> = {};
  for (const id of teacherIds) byTeacher[id] = [];
  for (const r of data ?? []) {
    const tid = r.teacher_id as string | undefined;
    if (!tid || !byTeacher[tid]) continue;
    byTeacher[tid].push({
      blockId: r.id as string,
      dayOfWeek: (r.day_of_week as string | null) ?? null,
      startsAt: (r.start_time as string | null) ?? null,
      endsAt: (r.end_time as string | null) ?? null,
      teacherId: (r.teacher_id as string | null) ?? null,
      teacherName: null,
      roomId: (r.room_id as string | null) ?? null,
      locationId: (r.location_id as string | null) ?? null,
      status: (r.status as string | null) ?? null,
    });
  }
  for (const id of teacherIds) {
    out[id] = summarizeNextLesson(byTeacher[id] ?? []);
  }
  return out;
}

export async function assignTeacherToStudent(
  tenantId: string,
  studentId: string,
  teacherId: string | null,
): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from("students")
    .update({
      teacher_id: teacherId,
      teacher_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", studentId);
  if (error) throw error;
}

/**
 * Next upcoming lesson per student from `schedule_blocks.block_date` (read-only).
 */
export async function getNextLessonLabelsForStudents(
  tenantId: string,
  studentIds: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (studentIds.length === 0) return out;
  const supabase = await clientFor(tenantId);
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
  if (error) throw error;
  for (const row of data ?? []) {
    const sid = row.student_id as string | null;
    if (!sid || out[sid]) continue;
    const d = row.block_date as string;
    const st = (row.start_time as string | null) ?? "";
    const en = (row.end_time as string | null) ?? "";
    out[sid] = en ? `${d} · ${st}–${en}` : `${d} · ${st || "—"}`;
  }
  return out;
}
