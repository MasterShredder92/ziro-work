/**
 * Reporting OS — KPI engine.
 *
 * A KPI is a tiny, typed metric computed from one or more report sources.
 * Each KPI is defined declaratively (label, format, direction) and paired
 * with a pure compute function that receives the tenant context and a
 * range. The computation reuses the unified query engine where possible.
 *
 * KPIs cover: enrollment, revenue, attendance, progress, assessments,
 * forms, messaging, automation.
 */

import "server-only";

import { fetchSource } from "./sources";
import type {
  KpiDefinition,
  KpiSnapshot,
  KpiValue,
  ReportRange,
} from "./types";

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Range helpers
// ---------------------------------------------------------------------------

function defaultRange(): ReportRange {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  from.setUTCMonth(from.getUTCMonth() - 3);
  return { from: from.toISOString().slice(0, 10), to };
}

function inRange(value: unknown, range: ReportRange): boolean {
  if (typeof value !== "string") return false;
  const t = new Date(value).getTime();
  if (!Number.isFinite(t)) return false;
  const from = new Date(`${range.from}T00:00:00Z`).getTime();
  const to = new Date(`${range.to}T23:59:59Z`).getTime();
  return t >= from && t <= to;
}

function daysInRange(range: ReportRange): number {
  const from = new Date(`${range.from}T00:00:00Z`).getTime();
  const to = new Date(`${range.to}T23:59:59Z`).getTime();
  return Math.max(1, Math.ceil((to - from) / (24 * 60 * 60 * 1000)));
}

function sum(rows: Row[], field: string): number {
  let total = 0;
  for (const r of rows) {
    const v = r[field];
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

function pct(num: number, denom: number): number {
  if (!denom) return 0;
  return Math.round((num / denom) * 100);
}

function isCalloutRow(row: Row): boolean {
  return (
    Boolean(row.callout_id) ||
    Boolean(row.is_family_callout) ||
    row.block_type === "call_out"
  );
}

// ---------------------------------------------------------------------------
// KPI registry
// ---------------------------------------------------------------------------

export const KPI_DEFINITIONS: KpiDefinition[] = [
  // Enrollment
  { key: "students.active", category: "enrollment", label: "Active students", description: "Students with status=active.", format: "number", direction: "higher_is_better", source: "students" },
  { key: "students.new_in_range", category: "enrollment", label: "New enrollments", description: "Students created within the selected range.", format: "number", direction: "higher_is_better", source: "students" },
  { key: "students.churn", category: "enrollment", label: "Churned students", description: "Students whose status became inactive in range.", format: "number", direction: "lower_is_better", source: "students" },
  { key: "students.retention_pct", category: "enrollment", label: "Retention rate", description: "Ratio of still-active students to the active count at range start.", format: "percent", direction: "higher_is_better", source: "derived" },

  // Revenue
  { key: "revenue.mrr_cents", category: "revenue", label: "MRR", description: "Monthly recurring revenue (cents).", format: "currency", direction: "higher_is_better", source: "subscriptions" },
  { key: "revenue.arr_cents", category: "revenue", label: "ARR", description: "Annual recurring revenue (cents).", format: "currency", direction: "higher_is_better", source: "subscriptions" },
  { key: "revenue.collected_cents", category: "revenue", label: "Collected revenue", description: "Total payments received within range.", format: "currency", direction: "higher_is_better", source: "payments" },
  { key: "revenue.overdue_cents", category: "revenue", label: "Overdue A/R", description: "Outstanding balance on invoices past their due date.", format: "currency", direction: "lower_is_better", source: "invoices" },
  { key: "revenue.forecast_cents", category: "revenue", label: "30-day forecast", description: "Projected collection for the next 30 days from MRR.", format: "currency", direction: "higher_is_better", source: "derived" },

  // Attendance
  { key: "attendance.rate_pct", category: "attendance", label: "Attendance rate", description: "Checked-in blocks as a percentage of held blocks.", format: "percent", direction: "higher_is_better", source: "schedule_blocks" },
  { key: "attendance.tardy_pct", category: "attendance", label: "Tardy rate", description: "Tardy blocks as a percentage of held blocks.", format: "percent", direction: "lower_is_better", source: "schedule_blocks" },
  { key: "attendance.absence_pct", category: "attendance", label: "Absence rate", description: "Callouts as a percentage of scheduled blocks.", format: "percent", direction: "lower_is_better", source: "schedule_blocks" },
  { key: "attendance.risk_flags", category: "attendance", label: "At-risk students", description: "Students with 2+ absences in the last 30 days.", format: "number", direction: "lower_is_better", source: "derived" },

  // Progress
  { key: "progress.mastery_pct", category: "progress", label: "Mastery rate", description: "Skills marked mastered as a percentage of all skills.", format: "percent", direction: "higher_is_better", source: "progress_skills" },
  { key: "progress.evidence_velocity", category: "progress", label: "Evidence velocity", description: "New evidence records per day within range.", format: "number", direction: "higher_is_better", source: "progress_evidence" },
  { key: "progress.checkpoint_completion_pct", category: "progress", label: "Checkpoint completion", description: "Completed checkpoints as a percentage of all checkpoints.", format: "percent", direction: "higher_is_better", source: "progress_checkpoints" },

  // Assessments
  { key: "assessments.avg_score", category: "assessments", label: "Average score", description: "Mean score across graded attempts.", format: "number", direction: "higher_is_better", source: "assessment_attempts" },
  { key: "assessments.pass_rate_pct", category: "assessments", label: "Pass rate", description: "Attempts marked as passing divided by total attempts.", format: "percent", direction: "higher_is_better", source: "assessment_attempts" },
  { key: "assessments.completion_rate_pct", category: "assessments", label: "Completion rate", description: "Completed attempts divided by all attempts in range.", format: "percent", direction: "higher_is_better", source: "assessment_attempts" },

  // Forms
  { key: "forms.submission_count", category: "forms", label: "Form submissions", description: "Total completed submissions in range.", format: "number", direction: "higher_is_better", source: "form_submissions" },
  { key: "forms.abandonment_rate_pct", category: "forms", label: "Abandonment rate", description: "Abandoned submissions divided by all submissions in range.", format: "percent", direction: "lower_is_better", source: "form_submissions" },
  { key: "forms.dropoff_count", category: "forms", label: "Drop-off count", description: "Submissions started but not completed in range.", format: "number", direction: "lower_is_better", source: "form_submissions" },

  // Messaging
  { key: "messaging.response_time_hours", category: "messaging", label: "Avg response time", description: "Hours between incoming message and first staff reply.", format: "number", direction: "lower_is_better", source: "messages" },
  { key: "messaging.unread_count", category: "messaging", label: "Unread threads", description: "Threads with unread messages.", format: "number", direction: "lower_is_better", source: "message_threads" },
  { key: "messaging.engagement_rate_pct", category: "messaging", label: "Engagement rate", description: "Threads with at least one reply divided by total threads.", format: "percent", direction: "higher_is_better", source: "message_threads" },

  // Automation
  { key: "automation.success_rate_pct", category: "automation", label: "Automation success rate", description: "Successful runs divided by total runs in range.", format: "percent", direction: "higher_is_better", source: "automation_runs" },
  { key: "automation.failure_rate_pct", category: "automation", label: "Automation failure rate", description: "Failed runs divided by total runs in range.", format: "percent", direction: "lower_is_better", source: "automation_runs" },
  { key: "automation.avg_run_time_ms", category: "automation", label: "Avg run time", description: "Mean run duration (milliseconds).", format: "number", direction: "lower_is_better", source: "automation_runs" },
];

export function listKpiDefinitions(): KpiDefinition[] {
  return [...KPI_DEFINITIONS];
}

export function getKpiDefinition(key: string): KpiDefinition | null {
  return KPI_DEFINITIONS.find((k) => k.key === key) ?? null;
}

// ---------------------------------------------------------------------------
// Compute
// ---------------------------------------------------------------------------

type ComputeContext = {
  tenantId: string;
  range: ReportRange;
};

const COMPUTERS: Record<string, (ctx: ComputeContext) => Promise<Partial<KpiValue>>> = {
  async "students.active"({ tenantId }) {
    const rows = await fetchSource("students", tenantId);
    const active = rows.filter((r) => r.status === "active").length;
    return { value: active };
  },
  async "students.new_in_range"({ tenantId, range }) {
    const rows = await fetchSource("students", tenantId);
    return { value: rows.filter((r) => inRange(r.created_at, range)).length };
  },
  async "students.churn"({ tenantId, range }) {
    const rows = await fetchSource("students", tenantId);
    const churned = rows.filter(
      (r) => r.status !== "active" && inRange(r.updated_at ?? r.created_at, range),
    ).length;
    return { value: churned };
  },
  async "students.retention_pct"({ tenantId }) {
    const rows = await fetchSource("students", tenantId);
    const active = rows.filter((r) => r.status === "active").length;
    const total = rows.length;
    return { value: pct(active, total) };
  },

  async "revenue.mrr_cents"({ tenantId }) {
    const rows = await fetchSource("subscriptions", tenantId);
    const active = rows.filter((r) => r.status === "active");
    const mrr = sum(active, "monthly_amount_cents") || sum(active, "amount_cents");
    return { value: mrr };
  },
  async "revenue.arr_cents"({ tenantId }) {
    const rows = await fetchSource("subscriptions", tenantId);
    const active = rows.filter((r) => r.status === "active");
    const mrr = sum(active, "monthly_amount_cents") || sum(active, "amount_cents");
    return { value: mrr * 12 };
  },
  async "revenue.collected_cents"({ tenantId, range }) {
    const rows = await fetchSource("payments", tenantId);
    const inWindow = rows.filter((r) =>
      inRange(r.paid_at ?? r.reporting_date ?? r.created_at, range),
    );
    const amount =
      sum(inWindow, "amount_cents") || sum(inWindow, "total_money_cents");
    return { value: amount };
  },
  async "revenue.overdue_cents"({ tenantId }) {
    const rows = await fetchSource("invoices", tenantId);
    const now = Date.now();
    let overdue = 0;
    for (const r of rows) {
      const due = typeof r.due_date === "string" ? new Date(r.due_date).getTime() : NaN;
      const outstanding =
        (typeof r.amount_cents === "number" ? r.amount_cents : 0) -
        (typeof r.amount_paid === "number" ? r.amount_paid : 0);
      if (Number.isFinite(due) && due < now && outstanding > 0) {
        overdue += outstanding;
      }
    }
    return { value: Math.max(0, overdue) };
  },
  async "revenue.forecast_cents"({ tenantId }) {
    const rows = await fetchSource("subscriptions", tenantId);
    const active = rows.filter((r) => r.status === "active");
    const mrr = sum(active, "monthly_amount_cents") || sum(active, "amount_cents");
    return { value: mrr };
  },

  async "attendance.rate_pct"({ tenantId, range }) {
    const rows = await fetchSource("schedule_blocks", tenantId);
    const inWindow = rows.filter((r) =>
      typeof r.block_date === "string"
        ? r.block_date >= range.from && r.block_date <= range.to
        : inRange(r.created_at, range),
    );
    const held = inWindow.filter((r) => !isCalloutRow(r)).length;
    const checked = inWindow.filter((r) => r.checked_in).length;
    return { value: pct(checked, held) };
  },
  async "attendance.tardy_pct"({ tenantId, range }) {
    const rows = await fetchSource("schedule_blocks", tenantId);
    const inWindow = rows.filter((r) =>
      typeof r.block_date === "string"
        ? r.block_date >= range.from && r.block_date <= range.to
        : inRange(r.created_at, range),
    );
    const total = inWindow.length;
    const tardy = inWindow.filter((r) => r.is_tardy === true).length;
    return { value: pct(tardy, total) };
  },
  async "attendance.absence_pct"({ tenantId, range }) {
    const rows = await fetchSource("schedule_blocks", tenantId);
    const inWindow = rows.filter((r) =>
      typeof r.block_date === "string"
        ? r.block_date >= range.from && r.block_date <= range.to
        : inRange(r.created_at, range),
    );
    const total = inWindow.length;
    const absent = inWindow.filter((r) => isCalloutRow(r)).length;
    return { value: pct(absent, total) };
  },
  async "attendance.risk_flags"({ tenantId }) {
    const rows = await fetchSource("schedule_blocks", tenantId);
    const now = Date.now();
    const cutoff = now - 30 * 24 * 60 * 60 * 1000;
    const byStudent = new Map<string, number>();
    for (const r of rows) {
      if (!r.student_id) continue;
      if (!isCalloutRow(r)) continue;
      const t = typeof r.block_date === "string" ? new Date(r.block_date).getTime() : NaN;
      if (!Number.isFinite(t) || t < cutoff) continue;
      const sid = String(r.student_id);
      byStudent.set(sid, (byStudent.get(sid) ?? 0) + 1);
    }
    let atRisk = 0;
    for (const [, count] of byStudent) if (count >= 2) atRisk += 1;
    return { value: atRisk };
  },

  async "progress.mastery_pct"({ tenantId }) {
    const rows = await fetchSource("progress_skills", tenantId);
    const mastered = rows.filter((r) => r.status === "mastered").length;
    return { value: pct(mastered, rows.length) };
  },
  async "progress.evidence_velocity"({ tenantId, range }) {
    const rows = await fetchSource("progress_evidence", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    return { value: Math.round((inWindow.length / daysInRange(range)) * 10) / 10 };
  },
  async "progress.checkpoint_completion_pct"({ tenantId }) {
    const rows = await fetchSource("progress_checkpoints", tenantId);
    const done = rows.filter((r) => r.status === "completed").length;
    return { value: pct(done, rows.length) };
  },

  async "assessments.avg_score"({ tenantId, range }) {
    const rows = await fetchSource("assessment_attempts", tenantId);
    const scored = rows
      .filter((r) => inRange(r.created_at, range))
      .map((r) => (typeof r.score === "number" ? r.score : null))
      .filter((n): n is number => n !== null);
    const avg =
      scored.length > 0 ? scored.reduce((a, b) => a + b, 0) / scored.length : 0;
    return { value: Math.round(avg * 10) / 10 };
  },
  async "assessments.pass_rate_pct"({ tenantId, range }) {
    const rows = await fetchSource("assessment_attempts", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    const passed = inWindow.filter((r) => r.passed === true || r.result === "pass").length;
    return { value: pct(passed, inWindow.length) };
  },
  async "assessments.completion_rate_pct"({ tenantId, range }) {
    const rows = await fetchSource("assessment_attempts", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    const completed = inWindow.filter((r) => r.status === "completed").length;
    return { value: pct(completed, inWindow.length) };
  },

  async "forms.submission_count"({ tenantId, range }) {
    const rows = await fetchSource("form_submissions", tenantId);
    const inWindow = rows.filter(
      (r) => r.status === "completed" && inRange(r.completed_at ?? r.created_at, range),
    );
    return { value: inWindow.length };
  },
  async "forms.abandonment_rate_pct"({ tenantId, range }) {
    const rows = await fetchSource("form_submissions", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    const abandoned = inWindow.filter((r) => r.status === "abandoned").length;
    return { value: pct(abandoned, inWindow.length) };
  },
  async "forms.dropoff_count"({ tenantId, range }) {
    const rows = await fetchSource("form_submissions", tenantId);
    const dropoffs = rows.filter(
      (r) => r.status !== "completed" && inRange(r.created_at, range),
    );
    return { value: dropoffs.length };
  },

  async "messaging.response_time_hours"({ tenantId, range }) {
    const rows = await fetchSource("messages", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    const durations: number[] = [];
    for (const r of inWindow) {
      if (typeof r.response_time_ms === "number") {
        durations.push(r.response_time_ms / (60 * 60 * 1000));
      }
    }
    const avg =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
    return { value: Math.round(avg * 10) / 10 };
  },
  async "messaging.unread_count"({ tenantId }) {
    const rows = await fetchSource("message_threads", tenantId);
    const unread = rows.filter((r) =>
      typeof r.unread_count === "number" ? r.unread_count > 0 : false,
    ).length;
    return { value: unread };
  },
  async "messaging.engagement_rate_pct"({ tenantId, range }) {
    const rows = await fetchSource("message_threads", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    const withReply = inWindow.filter((r) =>
      typeof r.message_count === "number" ? r.message_count > 1 : false,
    ).length;
    return { value: pct(withReply, inWindow.length) };
  },

  async "automation.success_rate_pct"({ tenantId, range }) {
    const rows = await fetchSource("automation_runs", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    const success = inWindow.filter((r) => r.status === "success").length;
    return { value: pct(success, inWindow.length) };
  },
  async "automation.failure_rate_pct"({ tenantId, range }) {
    const rows = await fetchSource("automation_runs", tenantId);
    const inWindow = rows.filter((r) => inRange(r.created_at, range));
    const fail = inWindow.filter(
      (r) => r.status === "failed" || r.status === "error",
    ).length;
    return { value: pct(fail, inWindow.length) };
  },
  async "automation.avg_run_time_ms"({ tenantId, range }) {
    const rows = await fetchSource("automation_runs", tenantId);
    const inWindow = rows
      .filter((r) => inRange(r.created_at, range))
      .map((r) => (typeof r.duration_ms === "number" ? r.duration_ms : null))
      .filter((n): n is number => n !== null);
    const avg =
      inWindow.length > 0
        ? inWindow.reduce((a, b) => a + b, 0) / inWindow.length
        : 0;
    return { value: Math.round(avg) };
  },
};

export async function computeKpi(
  key: string,
  tenantId: string,
  range: ReportRange = defaultRange(),
): Promise<KpiValue | null> {
  const def = getKpiDefinition(key);
  if (!def) return null;
  const fn = COMPUTERS[key];
  const partial = fn ? await fn({ tenantId, range }) : { value: 0 };
  return {
    key: def.key,
    category: def.category,
    label: def.label,
    value: typeof partial.value === "number" ? partial.value : 0,
    format: def.format,
    direction: def.direction,
    delta: partial.delta ?? null,
    deltaPct: partial.deltaPct ?? null,
    sublabel: partial.sublabel ?? null,
    generatedAt: new Date().toISOString(),
  };
}

export async function computeSnapshot(
  tenantId: string,
  range: ReportRange = defaultRange(),
  keys?: string[],
): Promise<KpiSnapshot> {
  const selected = keys && keys.length > 0
    ? keys.map((k) => getKpiDefinition(k)).filter((d): d is KpiDefinition => d !== null)
    : KPI_DEFINITIONS;
  const values: KpiValue[] = [];
  for (const def of selected) {
    const v = await computeKpi(def.key, tenantId, range);
    if (v) values.push(v);
  }
  return {
    tenantId,
    range,
    values,
    generatedAt: new Date().toISOString(),
  };
}
