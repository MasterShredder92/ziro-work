import type { Family as FamilyRow } from "@/lib/types/entities";

export type FamiliesKpi = {
  total: number;
  overdue: number;
  noTeacher: number;
  newLast30: number;
  activePct: number;
};

export type InsightSeverity = "urgent" | "opportunity" | "info";

export type InsightFilter = {
  status?: "overdue" | "no-teacher" | "new" | "trial";
  locationId?: string;
  search?: string;
};

export type Insight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  filter?: InsightFilter;
  count?: number;
};

export type InsightInput = {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  studentsByFamily: Record<string, Array<{ teacherName?: string | null }>>;
  teacherByFamily?: Record<string, string>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isOverdue(r: FamilyRow): boolean {
  const status = (r.billing_status ?? "").toLowerCase();
  if (status === "overdue") return true;
  const cents = (r as { overdue_balance_cents?: number | null }).overdue_balance_cents ?? 0;
  return cents > 0;
}

function isActive(r: FamilyRow): boolean {
  return (r.status ?? "").toLowerCase() === "active";
}

function isTrial(r: FamilyRow): boolean {
  return (r.status ?? "").toLowerCase() === "trial";
}

function familyAgeMs(r: FamilyRow, now: number): number {
  const created = (r as { created_at?: string | null }).created_at;
  if (!created) return Number.POSITIVE_INFINITY;
  const t = Date.parse(created);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return now - t;
}

function isNewLast30(r: FamilyRow, now: number): boolean {
  return familyAgeMs(r, now) <= 30 * DAY_MS;
}

function hasNoTeacher(r: FamilyRow, input: InsightInput): boolean {
  const studentCount = input.counts[r.id] ?? 0;
  if (studentCount === 0) return false;
  const t = input.teacherByFamily?.[r.id] ?? "";
  if (t.trim()) return false;
  const students = input.studentsByFamily[r.id] ?? [];
  return students.every((s) => !s.teacherName);
}

export function deriveKpi(input: InsightInput): FamiliesKpi {
  const now = Date.now();
  const { rows } = input;
  const total = rows.length;
  let overdue = 0;
  let noTeacher = 0;
  let newLast30 = 0;
  let active = 0;
  for (const r of rows) {
    if (isOverdue(r)) overdue += 1;
    if (hasNoTeacher(r, input)) noTeacher += 1;
    if (isNewLast30(r, now)) newLast30 += 1;
    if (isActive(r)) active += 1;
  }
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  return { total, overdue, noTeacher, newLast30, activePct };
}

function topLocationFor(
  rows: FamilyRow[],
  predicate: (r: FamilyRow) => boolean,
  locationNameById: Record<string, string>,
): { id: string | null; name: string | null; count: number } {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    if (!predicate(r)) continue;
    const id = r.primary_location_id ?? "";
    counts[id] = (counts[id] ?? 0) + 1;
  }
  let bestId = "";
  let bestCount = 0;
  for (const [id, c] of Object.entries(counts)) {
    if (c > bestCount) {
      bestId = id;
      bestCount = c;
    }
  }
  if (bestCount === 0) return { id: null, name: null, count: 0 };
  return { id: bestId || null, name: locationNameById[bestId] ?? null, count: bestCount };
}

export function deriveInsights(input: InsightInput): Insight[] {
  const now = Date.now();
  const { rows, locationNameById } = input;
  const out: Insight[] = [];

  const overdueRows = rows.filter(isOverdue);
  if (overdueRows.length > 0) {
    const hotspot = topLocationFor(rows, isOverdue, locationNameById);
    out.push({
      id: "overdue",
      severity: "urgent",
      title: `${overdueRows.length} ${overdueRows.length === 1 ? "family" : "families"} overdue`,
      body:
        hotspot.name && hotspot.count > 1
          ? `${hotspot.count} concentrated in ${hotspot.name}. Open the overdue list to triage.`
          : "Open the overdue list to triage payments.",
      filter: { status: "overdue" },
      count: overdueRows.length,
    });
  }

  const noTeacherRows = rows.filter((r) => hasNoTeacher(r, input));
  if (noTeacherRows.length > 0) {
    out.push({
      id: "no-teacher",
      severity: "opportunity",
      title: `${noTeacherRows.length} ${noTeacherRows.length === 1 ? "family" : "families"} with no teacher`,
      body: "Active students without an assigned instructor. Assign before next session.",
      filter: { status: "no-teacher" },
      count: noTeacherRows.length,
    });
  }

  const newRows = rows.filter((r) => isNewLast30(r, now));
  if (newRows.length > 0) {
    out.push({
      id: "new-30",
      severity: "info",
      title: `${newRows.length} new ${newRows.length === 1 ? "family" : "families"} in 30 days`,
      body: "Recent signups. Confirm onboarding, intake, and first lesson booked.",
      filter: { status: "new" },
      count: newRows.length,
    });
  }

  const trialRows = rows.filter(isTrial);
  if (trialRows.length > 0) {
    out.push({
      id: "trials",
      severity: "opportunity",
      title: `${trialRows.length} ${trialRows.length === 1 ? "trial" : "trials"} in flight`,
      body: "Convert before the trial window closes. Tag any that are ready to upgrade.",
      filter: { status: "trial" },
      count: trialRows.length,
    });
  }

  const noStudents = rows.filter((r) => (input.counts[r.id] ?? 0) === 0 && isActive(r));
  if (noStudents.length > 0 && out.length < 4) {
    out.push({
      id: "no-students",
      severity: "opportunity",
      title: `${noStudents.length} active ${noStudents.length === 1 ? "family" : "families"} with no students`,
      body: "Family record exists but no students linked. Add a student to start scheduling.",
      filter: {},
      count: noStudents.length,
    });
  }

  return out.slice(0, 5);
}
