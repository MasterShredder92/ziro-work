import type { Invoice, Student, StudentLifecycleEntry } from "./models";

export interface RiskScoreResult {
  studentId: string;
  score: number; // 0..100
  reasons: string[];
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeStudentRiskScore(input: {
  student: Student;
  invoices: Invoice[];
  lifecycle: StudentLifecycleEntry[];
  now?: string;
}): RiskScoreResult {
  const reasons: string[] = [];
  let score = 0;

  const now = Date.parse(input.now ?? new Date().toISOString());

  if (input.student.archived_at) {
    return { studentId: input.student.id, score: 0, reasons: ["archived"] };
  }

  if (input.student.status !== "active") {
    score += 15;
    reasons.push(`status:${input.student.status}`);
  }

  if (input.student.last_attendance_at) {
    const last = Date.parse(input.student.last_attendance_at);
    const days = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (days >= 14) {
      score += 25;
      reasons.push("no_attendance_14d");
    } else if (days >= 7) {
      score += 15;
      reasons.push("no_attendance_7d");
    }
  } else {
    score += 10;
    reasons.push("no_attendance_recorded");
  }

  const overdue = input.invoices.filter(
    (i) => i.archived_at == null && i.status === "overdue"
  );
  if (overdue.length > 0) {
    score += 10 + Math.min(20, overdue.length * 5);
    reasons.push(`overdue_invoices:${overdue.length}`);
  }

  // Missed lessons (heuristic): lifecycle entries with types indicating missed attendance.
  const missed30d = input.lifecycle.filter((e) => {
    const t = Date.parse(e.occurred_at);
    if (!Number.isFinite(t)) return false;
    if (now - t > 1000 * 60 * 60 * 24 * 30) return false;
    const type = String(e.type ?? "").toLowerCase();
    return type.includes("missed") || type.includes("no_show") || type.includes("absent");
  }).length;
  if (missed30d > 0) {
    score += Math.min(40, missed30d * 10);
    reasons.push(`missed_lessons_30d:${missed30d}`);
  }

  // Negative lifecycle events (heuristic): complaints/cancel/refund markers.
  const negative30d = input.lifecycle.filter((e) => {
    const t = Date.parse(e.occurred_at);
    if (!Number.isFinite(t)) return false;
    if (now - t > 1000 * 60 * 60 * 24 * 30) return false;
    const type = String(e.type ?? "").toLowerCase();
    return (
      type.includes("complaint") ||
      type.includes("cancel") ||
      type.includes("refund") ||
      type.includes("churn") ||
      type.includes("chargeback") ||
      type.startsWith("negative_")
    );
  }).length;
  if (negative30d > 0) {
    score += Math.min(20, negative30d * 10);
    reasons.push(`negative_events_30d:${negative30d}`);
  }

  const recentRisk = input.lifecycle.some((e) => {
    if (e.type !== "risk") return false;
    const t = Date.parse(e.occurred_at);
    return Number.isFinite(t) && now - t <= 1000 * 60 * 60 * 24 * 30;
  });
  if (recentRisk) {
    score += 10;
    reasons.push("recent_risk_lifecycle");
  }

  return { studentId: input.student.id, score: clamp(score, 0, 100), reasons };
}

