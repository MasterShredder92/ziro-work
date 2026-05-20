import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import type { LifecycleContext } from "./types";

function daysBetween(a: Date, b: Date) {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function computeRiskScore(signals: {
  missedLessons30d: number;
  overdueInvoices: number;
  negativeEvents30d: number;
  inactivityDays: number | null;
}) {
  let score = 0;
  score += Math.min(40, signals.missedLessons30d * 10);
  score += Math.min(30, signals.overdueInvoices * 15);
  score += Math.min(20, signals.negativeEvents30d * 10);
  if (signals.inactivityDays != null)
    score += Math.min(30, Math.floor(signals.inactivityDays / 7) * 5);

  let band: "low" | "medium" | "high" = "low";
  if (score >= 60) band = "high";
  else if (score >= 30) band = "medium";

  return { score, band };
}

export async function buildLifecycleContext(studentId: string): Promise<LifecycleContext> {
  assertServiceRoleAllowed("src/lib/lifecycle/buildContext.ts — service-role module; internal/background operations only");
  const supabase = getServiceClient();
  const now = new Date();

  const { data: row, error } = await supabase
    .from("view_student_lifecycle_context")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) throw error;
  if (!row) throw new Error(`Student not found: ${studentId}`);

  const inactivityDays = row.last_activity_date
    ? (() => {
        const d = new Date(row.last_activity_date as string);
        return Number.isFinite(d.getTime()) ? daysBetween(now, d) : null;
      })()
    : null;

  const signals = {
    missedLessons30d: (row.missed_lessons_30d as number) ?? 0,
    overdueInvoices: (row.overdue_invoices as number) ?? 0,
    negativeEvents30d: (row.negative_events_30d as number) ?? 0,
    inactivityDays,
  };

  const { score: riskScore, band: riskBand } = computeRiskScore(signals);

  return {
    tenantId: row.tenant_id as string,
    studentId: row.student_id as string,
    student: (row.student ?? {}) as Record<string, unknown>,
    lead: (row.lead ?? null) as Record<string, unknown> | null,
    trial: (row.trial ?? null) as Record<string, unknown> | null,
    invoices: [],
    events: (row.stage_events ?? []) as Record<string, unknown>[],
    attendance: [],
    teacherAssigned: row.teacher_assigned as boolean,
    scheduled: row.scheduled as boolean,
    enrolled: row.enrolled as boolean,
    serviceStarted: row.service_started as boolean,
    riskScore,
    riskBand,
    signals,
  };
}
