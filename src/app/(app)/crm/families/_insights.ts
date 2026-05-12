import type { Family as FamilyRow } from "@/lib/types/entities";

// ─── Types ─────────────────────────────────────────────────────────────────

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

export type RiskBand = "critical" | "risk" | "watch" | "fine";

export type RiskScore = {
  score: number;
  band: RiskBand;
  reasons: string[];
  topReason: string | null;
};

export type BriefTopRisk = {
  familyId: string;
  name: string;
  score: number;
  band: RiskBand;
  reason: string;
};

export type DailyBrief = {
  greeting: string;
  headline: string;
  sub: string;
  topRisks: BriefTopRisk[];
  highlight: string | null;
};

export type InsightInput = {
  rows: FamilyRow[];
  counts: Record<string, number>;
  locationNameById: Record<string, string>;
  studentsByFamily: Record<string, Array<{ teacherId?: string | null; teacherName?: string | null; status?: string | null }>>;
  teacherByFamily?: Record<string, string>;
  /** Count of active students per family (preferred over `counts` for ratio math). */
  activeStudentCountByFamily?: Record<string, number>;
  /** Count of active students per family with `teacher_id IS NULL`. */
  missingTeacherByFamily?: Record<string, number>;
  /** Map of family_id → ISO timestamp of most recent message (any direction). */
  lastMessageAtByFamily?: Record<string, string>;
  /** Server-side `now()` ms for deterministic age math. */
  nowMs: number;
};

// ─── Shared row helpers ────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function isOverdue(r: FamilyRow): boolean {
  const cents = (r as { overdue_balance_cents?: number | null }).overdue_balance_cents ?? 0;
  return cents > 0;
}

function overdueCentsOf(r: FamilyRow): number {
  return (r as { overdue_balance_cents?: number | null }).overdue_balance_cents ?? 0;
}

function isActive(r: FamilyRow): boolean {
  return (r.status ?? "").toLowerCase() === "active";
}

function isTrial(r: FamilyRow): boolean {
  return (r.status ?? "").toLowerCase() === "trial";
}

function ageMs(r: FamilyRow, nowMs: number): number {
  const created = (r as { created_at?: string | null }).created_at;
  if (!created) return Number.POSITIVE_INFINITY;
  const t = Date.parse(created);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return nowMs - t;
}

function isNewLast30(r: FamilyRow, nowMs: number): boolean {
  return ageMs(r, nowMs) <= 30 * DAY_MS;
}

function autopayOff(r: FamilyRow): boolean {
  return (r as { autopay_enabled?: boolean | null }).autopay_enabled === false;
}

/**
 * True when the family has at least one ACTIVE student with `teacher_id IS NULL`.
 * Uses the precomputed missingTeacherByFamily map when available, otherwise
 * falls back to inspecting studentsByFamily.
 */
function hasNoTeacher(r: FamilyRow, input: InsightInput): boolean {
  const missing = input.missingTeacherByFamily?.[r.id];
  if (missing != null) return missing > 0;
  const students = input.studentsByFamily[r.id] ?? [];
  const actives = students.filter((s) => (s.status ?? "").toLowerCase() === "active");
  if (actives.length === 0) return false;
  return actives.some((s) => !s.teacherId && !s.teacherName);
}

function missingTeacherCount(r: FamilyRow, input: InsightInput): number {
  if (input.missingTeacherByFamily?.[r.id] != null) return input.missingTeacherByFamily[r.id]!;
  const students = input.studentsByFamily[r.id] ?? [];
  return students.filter((s) =>
    (s.status ?? "").toLowerCase() === "active" && !s.teacherId && !s.teacherName,
  ).length;
}

function activeStudentCount(r: FamilyRow, input: InsightInput): number {
  if (input.activeStudentCountByFamily?.[r.id] != null) return input.activeStudentCountByFamily[r.id]!;
  const students = input.studentsByFamily[r.id] ?? [];
  return students.filter((s) => (s.status ?? "").toLowerCase() === "active").length;
}

function daysSinceLastMessage(r: FamilyRow, input: InsightInput): number | null {
  const iso = input.lastMessageAtByFamily?.[r.id];
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((input.nowMs - t) / DAY_MS);
}

// ─── KPI ───────────────────────────────────────────────────────────────────

export function deriveKpi(input: InsightInput): FamiliesKpi {
  const { rows, nowMs } = input;
  const total = rows.length;
  let overdue = 0;
  let noTeacher = 0;
  let newLast30 = 0;
  let active = 0;
  for (const r of rows) {
    if (isOverdue(r)) overdue += 1;
    if (hasNoTeacher(r, input)) noTeacher += 1;
    if (isNewLast30(r, nowMs)) newLast30 += 1;
    if (isActive(r)) active += 1;
  }
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  return { total, overdue, noTeacher, newLast30, activePct };
}

// ─── Risk score (heuristic, deterministic, real-signal) ───────────────────
//
// Weights are intentionally conservative so the score reflects observable
// reality, not narrative drama. Components only fire when supporting data
// actually exists for this tenant.
//
//   Overdue balance     up to 50 pts  (scales linearly to $400, then caps)
//   Active + 0 students    25 pts     (stale account)
//   Has students + no teacher  15 pts
//   Autopay off + has students  10 pts
//   Inactive status         5 pts     (small dampener)
//   No message in 30+ days  +0 / +10  (only when we actually have message history)
//
// Capped at 99. Bands:
//   80+  critical
//   55+  risk
//   25+  watch
//    *   fine

export function computeRiskScore(r: FamilyRow, input: InsightInput): RiskScore {
  const reasons: string[] = [];
  let score = 0;
  const studentCount = input.counts[r.id] ?? 0;

  const overdueCents = overdueCentsOf(r);
  if (overdueCents > 0) {
    const dollars = overdueCents / 100;
    const overduePts = Math.min(50, Math.round((dollars / 400) * 50));
    score += overduePts;
    reasons.push(`Overdue $${dollars.toFixed(0)}`);
  }

  if (isActive(r) && studentCount === 0) {
    score += 25;
    reasons.push("Active with 0 students");
  }

  if (studentCount > 0 && hasNoTeacher(r, input)) {
    const missing = missingTeacherCount(r, input);
    const activeCount = activeStudentCount(r, input);
    const everyoneMissing = activeCount > 0 && missing >= activeCount;
    score += everyoneMissing ? 15 : 8;
    if (activeCount > 1 && missing < activeCount) {
      reasons.push(`${missing} of ${activeCount} students unassigned`);
    } else if (activeCount > 1) {
      reasons.push(`All ${activeCount} students unassigned`);
    } else {
      reasons.push("Student has no teacher");
    }
  }

  if (studentCount > 0 && autopayOff(r)) {
    score += 10;
    reasons.push("Autopay off");
  }

  if (!isActive(r) && (r.status ?? "").toLowerCase() !== "trial") {
    score += 5;
  }

  const dsm = daysSinceLastMessage(r, input);
  if (dsm != null && dsm >= 30) {
    score += 10;
    reasons.push(`No message in ${dsm}d`);
  }

  score = Math.max(0, Math.min(99, score));

  const band: RiskBand =
    score >= 80 ? "critical" :
    score >= 55 ? "risk" :
    score >= 25 ? "watch" :
    "fine";

  return {
    score,
    band,
    reasons,
    topReason: reasons[0] ?? null,
  };
}

export function deriveRiskByFamily(input: InsightInput): Record<string, RiskScore> {
  const out: Record<string, RiskScore> = {};
  for (const r of input.rows) {
    out[r.id] = computeRiskScore(r, input);
  }
  return out;
}

// ─── Insight cards ────────────────────────────────────────────────────────

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
  const { rows, locationNameById, nowMs } = input;
  const out: Insight[] = [];

  const overdueRows = rows.filter(isOverdue);
  if (overdueRows.length > 0) {
    const hotspot = topLocationFor(rows, isOverdue, locationNameById);
    const totalCents = overdueRows.reduce((s, r) => s + overdueCentsOf(r), 0);
    out.push({
      id: "overdue",
      severity: "urgent",
      title: `${overdueRows.length} ${overdueRows.length === 1 ? "family" : "families"} overdue · $${Math.round(totalCents / 100).toLocaleString()}`,
      body:
        hotspot.name && hotspot.count > 1
          ? `${hotspot.count} concentrated in ${hotspot.name}. Open to triage.`
          : "Open the overdue list to triage payments.",
      filter: { status: "overdue" },
      count: overdueRows.length,
    });
  }

  const noTeacherRows = rows.filter((r) => hasNoTeacher(r, input));
  if (noTeacherRows.length > 0) {
    const totalUnassigned = noTeacherRows.reduce(
      (acc, r) => acc + missingTeacherCount(r, input),
      0,
    );
    out.push({
      id: "no-teacher",
      severity: "opportunity",
      title:
        totalUnassigned === noTeacherRows.length
          ? `${noTeacherRows.length} ${noTeacherRows.length === 1 ? "family" : "families"} with no teacher`
          : `${totalUnassigned} students unassigned across ${noTeacherRows.length} ${noTeacherRows.length === 1 ? "family" : "families"}`,
      body: "Active students without an assigned instructor. Assign before next session.",
      filter: { status: "no-teacher" },
      count: noTeacherRows.length,
    });
  }

  const newRows = rows.filter((r) => isNewLast30(r, nowMs));
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
      body: "Convert before the trial window closes.",
      filter: { status: "trial" },
      count: trialRows.length,
    });
  }

  const staleActive = rows.filter((r) => (input.counts[r.id] ?? 0) === 0 && isActive(r));
  if (staleActive.length > 0 && out.length < 5) {
    out.push({
      id: "no-students",
      severity: "opportunity",
      title: `${staleActive.length} active ${staleActive.length === 1 ? "family" : "families"} with no students`,
      body: "Family records exist but no students linked. Add a student or archive.",
      filter: {},
      count: staleActive.length,
    });
  }

  return out.slice(0, 5);
}

// ─── Daily brief ──────────────────────────────────────────────────────────

function greetingForHour(hour: number): string {
  if (hour < 5) return "Late night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}

function firstName(name: string): string {
  return (name.split(/\s+/)[0] ?? name).replace(/\s+family$/i, "");
}

export function deriveBrief(input: InsightInput, kpi: FamiliesKpi, risks: Record<string, RiskScore>): DailyBrief {
  const { rows, nowMs } = input;
  const hour = new Date(nowMs).getHours();
  const greeting = greetingForHour(hour);

  const overdueRows = rows.filter(isOverdue);
  const overdueTotalCents = overdueRows.reduce((s, r) => s + overdueCentsOf(r), 0);

  const rankedRisks: BriefTopRisk[] = rows
    .map((r) => {
      const risk = risks[r.id];
      if (!risk) return null;
      return {
        familyId: r.id,
        name: firstName(r.name),
        score: risk.score,
        band: risk.band,
        reason: risk.topReason ?? "",
      };
    })
    .filter((x): x is BriefTopRisk => x !== null && x.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  let headline: string;
  let sub: string;

  if (overdueTotalCents > 0 && rankedRisks.length > 0) {
    const dollars = Math.round(overdueTotalCents / 100).toLocaleString();
    headline = `${rankedRisks.length} ${rankedRisks.length === 1 ? "family needs" : "families need"} your attention today.`;
    sub = `$${dollars} overdue across ${overdueRows.length} ${overdueRows.length === 1 ? "family" : "families"}.`;
  } else if (rankedRisks.length > 0) {
    headline = `${rankedRisks.length} ${rankedRisks.length === 1 ? "family needs" : "families need"} a look.`;
    sub = `No payment issues right now — risk is operational.`;
  } else if (overdueTotalCents > 0) {
    headline = `${overdueRows.length} ${overdueRows.length === 1 ? "family is" : "families are"} overdue.`;
    sub = `$${Math.round(overdueTotalCents / 100).toLocaleString()} outstanding.`;
  } else {
    headline = `All systems steady.`;
    sub = `${kpi.total} families · ${kpi.activePct}% active.`;
  }

  let highlight: string | null = null;
  if (kpi.newLast30 > 0) {
    highlight = `${kpi.newLast30} new ${kpi.newLast30 === 1 ? "family" : "families"} in the last 30 days.`;
  }

  return { greeting, headline, sub, topRisks: rankedRisks, highlight };
}
