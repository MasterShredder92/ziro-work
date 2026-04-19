import { getServiceClient } from "@/lib/supabase";
import type { LifecycleContext } from "./types";

function daysBetween(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isOverdueInvoice(inv: Record<string, unknown>, now: Date) {
  const status = (inv.status as string | undefined) ?? null;
  if (status === "overdue") return true;
  const dueAtRaw = (inv.due_at as string | null | undefined) ?? null;
  const paidAtRaw = (inv.paid_at as string | null | undefined) ?? null;
  if (!dueAtRaw) return false;
  if (paidAtRaw) return false;
  const dueAt = new Date(dueAtRaw);
  return Number.isFinite(dueAt.getTime()) && dueAt.getTime() < now.getTime();
}

function looksNegativeEventType(eventType: string) {
  const t = eventType.toLowerCase();
  return (
    t.includes("complaint") ||
    t.includes("refund") ||
    t.includes("cancel") ||
    t.includes("churn") ||
    t.includes("chargeback") ||
    t.startsWith("negative_")
  );
}

function hasTruthyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePositiveNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function computeRiskScoreFromSignals(signals: {
  missedLessons30d: number;
  overdueInvoices: number;
  negativeEvents30d: number;
  inactivityDays: number | null;
}) {
  let score = 0;
  score += Math.min(40, signals.missedLessons30d * 10);
  score += Math.min(30, signals.overdueInvoices * 15);
  score += Math.min(20, signals.negativeEvents30d * 10);
  if (signals.inactivityDays != null) score += Math.min(30, Math.floor(signals.inactivityDays / 7) * 5);

  let band: "low" | "medium" | "high" = "low";
  if (score >= 60) band = "high";
  else if (score >= 30) band = "medium";

  return { score, band };
}

/**
 * Build the unified lifecycle context for a given student id.
 * Uses service role client to keep this backend-only and deterministic.
 */
export async function buildLifecycleContext(studentId: string): Promise<LifecycleContext> {
  const supabase = getServiceClient();
  const now = new Date();

  const { data: student, error: studentErr } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (studentErr) throw studentErr;
  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }

  const tenantId = (student.tenant_id as string | undefined) ?? "";
  if (!tenantId) throw new Error(`Student missing tenant_id: ${studentId}`);

  // Schema-compatible field resolution: these columns differ across migrations.
  const leadId =
    (student.lead_id as string | null | undefined) ??
    (student.crm_lead_id as string | null | undefined) ??
    null;
  const teacherId =
    (student.teacher_id as string | null | undefined) ??
    (student.assigned_teacher_id as string | null | undefined) ??
    null;

  const [{ data: lead }, { data: trialRows }, { data: invoiceRows }, { data: eventRows }, { data: attendanceRows }] =
    await Promise.all([
      leadId
        ? supabase.from("leads").select("*").eq("tenant_id", tenantId).eq("id", leadId).maybeSingle()
        : Promise.resolve({ data: null } as { data: null }),
      leadId
        ? supabase
            .from("trials")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("lead_id", leadId)
            .order("scheduled_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] } as { data: unknown[] }),
      supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("events")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("entity_type", "student")
        .eq("entity_id", studentId)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("attendance")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("student_id", studentId)
        .order("lesson_date", { ascending: false })
        .limit(200),
    ]);

  const trial =
    Array.isArray(trialRows) && trialRows.length > 0
      ? (trialRows[0] as Record<string, unknown>)
      : null;
  const invoices = (invoiceRows ?? []) as Record<string, unknown>[];
  const events = (eventRows ?? []) as Record<string, unknown>[];
  const attendance = (attendanceRows ?? []) as Record<string, unknown>[];

  const teacherAssigned = Boolean(teacherId);
  const trialStatus = (trial?.status as string | undefined) ?? null;
  const studentStatus = ((student.status as string | undefined) ?? "").toLowerCase();
  const hasStartDate = hasTruthyString(student.start_date);
  const hasFirstLessonDate = hasTruthyString(student.first_lesson_date);
  const hasLessonDay = hasTruthyString(student.lesson_day_of_week);
  const blocksPerWeek = parsePositiveNumber(student.blocks_per_week);
  const totalLessonsTaken = parsePositiveNumber(student.total_lessons_taken);
  const scheduled =
    trialStatus === "scheduled" ||
    trialStatus === "confirmed" ||
    (typeof trial?.scheduled_at === "string" && new Date(trial.scheduled_at).getTime() > now.getTime()) ||
    (teacherAssigned && (hasLessonDay || blocksPerWeek > 0));

  const enrolled =
    Boolean(student.enrollment_date) ||
    hasStartDate ||
    hasFirstLessonDate ||
    studentStatus === "active" ||
    studentStatus === "enrolled";
  const serviceStarted = attendance.length > 0 || totalLessonsTaken > 0 || hasFirstLessonDate || hasStartDate;

  // Missed lessons in last 30 days
  const last30 = attendance.filter((r) => {
    const d = new Date((r.lesson_date as string) ?? "");
    if (!Number.isFinite(d.getTime())) return false;
    const diff = now.getTime() - d.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  });
  const missedLessons30d = last30.filter((r) => (r.present as boolean) === false).length;

  const overdueInvoices = invoices.filter((inv) => isOverdueInvoice(inv, now)).length;

  const negativeEvents30d = events.filter((e) => {
    const createdAtRaw = (e.created_at as string | undefined) ?? null;
    const t = (e.event_type as string | undefined) ?? "";
    if (!createdAtRaw) return false;
    const createdAt = new Date(createdAtRaw);
    if (!Number.isFinite(createdAt.getTime())) return false;
    const days = daysBetween(now, createdAt);
    return days >= 0 && days <= 30 && looksNegativeEventType(t);
  }).length;

  // Inactivity: prefer explicit last_attendance_at; else derive from most recent attendance.
  const lastAttendanceRaw =
    (student.last_attendance_at as string | null | undefined) ??
    ((attendance[0]?.lesson_date as string | undefined) ?? null) ??
    (hasTruthyString(student.first_lesson_date) ? (student.first_lesson_date as string) : null) ??
    (hasTruthyString(student.start_date) ? (student.start_date as string) : null);
  const inactivityDays = lastAttendanceRaw
    ? (() => {
        const d = new Date(lastAttendanceRaw);
        return Number.isFinite(d.getTime()) ? daysBetween(now, d) : null;
      })()
    : null;

  const signals = { missedLessons30d, overdueInvoices, negativeEvents30d, inactivityDays };
  const { score: riskScore, band: riskBand } = computeRiskScoreFromSignals(signals);

  return {
    tenantId,
    studentId,
    student: student as Record<string, unknown>,
    lead: (lead as Record<string, unknown> | null) ?? null,
    trial,
    invoices,
    events,
    attendance,
    teacherAssigned,
    scheduled,
    enrolled,
    serviceStarted,
    riskScore,
    riskBand,
    signals,
  };
}

