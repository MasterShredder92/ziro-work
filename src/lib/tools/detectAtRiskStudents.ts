import { getServiceClient } from "@/lib/supabase";
import type { AgentContext } from "../agents/types";
import type { Attendance } from "../types/attendance";
import type { Student } from "../types/students";
import { computeAttendanceHealth } from "./computeAttendanceHealth";

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

export async function detectAtRiskStudents(ctx: AgentContext) {
  const students: Student[] = await ctx.tools.get_students({ tenantId: ctx.tenantId });
  const svc = getServiceClient();
  const now = new Date();

  const flagged: { student_id: string; missed_in_last_30_days: number }[] = [];

  for (const student of students) {
    const { data: attendanceRows, error } = await ctx.supabase
      .from("attendance")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("student_id", student.id);

    if (error) continue;

    const health = await computeAttendanceHealth(ctx, (attendanceRows || []) as Attendance[]);

    const { data: invoices } = await svc
      .from("invoices")
      .select("status,due_at,paid_at")
      .eq("tenant_id", ctx.tenantId)
      .eq("student_id", student.id)
      .limit(50);

    const overdueInvoices =
      (invoices ?? []).filter((inv: Record<string, unknown>) => {
        if (inv.status === "overdue") return true;
        if (!inv.due_at || inv.paid_at) return false;
        const due = new Date(String(inv.due_at));
        return Number.isFinite(due.getTime()) && due.getTime() < now.getTime();
      }).length ?? 0;

    const { data: events } = await svc
      .from("events")
      .select("event_type,created_at")
      .eq("tenant_id", ctx.tenantId)
      .eq("entity_type", "student")
      .eq("entity_id", student.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const negativeEvents30d =
      (events ?? []).filter((e: Record<string, unknown>) => {
        const createdAt = new Date(String(e.created_at ?? ""));
        if (!Number.isFinite(createdAt.getTime())) return false;
        const days = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (days < 0 || days > 30) return false;
        return looksNegativeEventType(String(e.event_type ?? ""));
      }).length ?? 0;

    const lastAttendanceRaw = student.last_attendance_at ?? null;
    const inactivityDays =
      lastAttendanceRaw != null
        ? Math.floor((now.getTime() - new Date(lastAttendanceRaw).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const riskScore =
      Math.min(40, health.missed_in_last_30_days * 10) +
      Math.min(30, overdueInvoices * 15) +
      Math.min(20, negativeEvents30d * 10) +
      (inactivityDays != null ? Math.min(30, Math.floor(inactivityDays / 7) * 5) : 0);

    const highRisk = riskScore >= 60 || health.health === "at_risk";

    if (highRisk) {
      flagged.push({
        student_id: student.id,
        missed_in_last_30_days: health.missed_in_last_30_days,
      });
    }
  }

  return flagged;
}

