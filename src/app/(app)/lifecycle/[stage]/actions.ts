"use server";

import { logAudit } from "@/lib/audit/log";
import { buildLifecycleContext } from "@/lib/lifecycle/buildContext";
import { computeStage } from "@/lib/lifecycle/computeStage";
import { getLifecycleStage } from "@/lib/lifecycle/stages";
import { assertValidStageId, summarizeBlockers } from "@/lib/lifecycle/helpers";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { getServiceClient } from "@/lib/supabase";
import type { ComputedLifecycle, LifecycleStageId } from "@/lib/lifecycle/types";

const STAGE_LOAD_CONCURRENCY = 8;
const STAGE_LOAD_MAX_CANDIDATES = 800;
const STAGE_LOAD_BUDGET_MS = 20_000;
const STAGE_CONTEXT_MAX_ROWS = 80;

export type LifecycleStageSurfaceDTO = {
  stageId: LifecycleStageId;
  stageName: string;
  stageDescription: string;
  agentKey: string;
  agentDisplayName: string;
  students: Array<{
    id: string;
    name: string;
    // Contact info sourced from linked family, not student record
    family_email: string | null;
    family_phone: string | null;
    blockers: string[];
    nextStep: string;
    riskBand: "low" | "medium" | "high";
  }>;
  agentSummary: string;
  warnings: Array<{
    code: string;
    message: string;
  }>;
};

function formatAgentDisplayName(raw: string): string {
  const table: Record<string, string> = {
    star: "STAR",
    ziro: "Ziro",
    ruby: "Ruby",
    stewie: "Stewie",
    vader: "Vader",
    bub: "Bub",
    sid: "Sid",
  };
  return table[raw] ?? raw.replace(/-/g, " ");
}

function nextStepLabel(computed: ComputedLifecycle): string {
  if (computed.blockers.length > 0) {
    return computed.blockers[0]?.message ?? "Fix what needs attention first.";
  }
  if (computed.next) return `Move forward to ${computed.next.name}`;
  return `Finish ${computed.stage.name}`;
}

function normalizeError(err: unknown): { message: string; code: string | null } {
  if (err instanceof Error) return { message: err.message, code: null };
  if (err && typeof err === "object") {
    const rec = err as Record<string, unknown>;
    const message = typeof rec.message === "string" ? rec.message : JSON.stringify(rec);
    const code = typeof rec.code === "string" ? rec.code : null;
    return { message: message || "Unknown error", code };
  }
  return { message: String(err ?? "Unknown error"), code: null };
}

function isMissingColumnError(err: unknown, column: string): boolean {
  const normalized = normalizeError(err);
  if (normalized.code !== "42703") return false;
  return normalized.message.toLowerCase().includes(column.toLowerCase());
}

function mapAuthError(message: string): string {
  if (message === "UNAUTHENTICATED") return "You are signed out. Sign in and reload.";
  if (message === "FORBIDDEN") return "Your account is missing lifecycle access for this workspace.";
  return message;
}

function getString(row: Record<string, unknown>, key: string): string {
  const raw = row[key];
  return typeof raw === "string" ? raw.trim() : "";
}

function hasValue(row: Record<string, unknown>, key: string): boolean {
  const raw = row[key];
  if (raw == null) return false;
  if (typeof raw === "string") return raw.trim().length > 0;
  return true;
}

function pickContact(row: Record<string, unknown>): { family_email: string | null; family_phone: string | null } {
  // Contact data lives on the family record, not the student.
  const email = getString(row, "primary_email") || getString(row, "family_primary_email") || null;
  const phone = getString(row, "primary_phone") || getString(row, "family_primary_phone") || null;
  return { family_email: email, family_phone: phone };
}

function inferFallbackRiskBand(row: Record<string, unknown>): "low" | "medium" | "high" {
  const status = getString(row, "status").toLowerCase();
  if (status === "inactive" || status === "churned" || status === "cancelled") return "high";
  if (hasValue(row, "enrollment_date")) return "medium";
  return "low";
}

const STAGE_ORDER: LifecycleStageId[] = [
  "intake",
  "lead-work",
  "scheduling",
  "enrollment",
  "service-delivery",
  "relationship",
  "retention",
  "win-back",
];

function stageRank(stageId: LifecycleStageId): number {
  return STAGE_ORDER.indexOf(stageId);
}

function inferOperationalStage(row: Record<string, unknown>): LifecycleStageId {
  const status = getString(row, "status").toLowerCase();
  if (status === "inactive") {
    return "win-back";
  }
  const overdueAmountRaw = row.overdue_amount;
  const overdueAmount =
    typeof overdueAmountRaw === "number"
      ? overdueAmountRaw
      : typeof overdueAmountRaw === "string"
        ? Number(overdueAmountRaw)
        : 0;
  if (Number.isFinite(overdueAmount) && overdueAmount > 0) return "retention";

  const totalLessonsRaw = row.total_lessons_taken;
  const totalLessons =
    typeof totalLessonsRaw === "number"
      ? totalLessonsRaw
      : typeof totalLessonsRaw === "string"
        ? Number(totalLessonsRaw)
        : 0;

  if (Number.isFinite(totalLessons) && totalLessons >= 8) return "relationship";
  if (
    (Number.isFinite(totalLessons) && totalLessons >= 1) ||
    hasValue(row, "first_lesson_date") ||
    hasValue(row, "start_date")
  ) {
    return "service-delivery";
  }
  if (hasValue(row, "teacher_id")) return "scheduling";
  if (hasValue(row, "intake_submission_id") || hasValue(row, "email") || hasValue(row, "phone")) {
    return "lead-work";
  }
  return "intake";
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
  const out = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: safeConcurrency }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) break;
      out[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return out;
}

async function loadCandidateStudents(input: {
  tenantId: string;
  locationId: string | null | undefined;
}): Promise<{
  rows: Array<Record<string, unknown>>;
  warnings: LifecycleStageSurfaceDTO["warnings"];
  error: { message: string; code?: string } | null;
}> {
  const supabase = getServiceClient();
  const warnings: LifecycleStageSurfaceDTO["warnings"] = [];

  const run = async (
    activeFilter: "deactivated_at" | "archived_at" | "none",
    enforceLocation: boolean,
  ): Promise<{ rows: Array<Record<string, unknown>>; error: { message: string; code?: string } | null }> => {
    let query = supabase
      .from("students")
      .select("*")
      .eq("tenant_id", input.tenantId);

    if (enforceLocation && input.locationId && input.locationId.trim().length > 0) {
      query = query.eq("location_id", input.locationId.trim());
    }

    if (activeFilter === "deactivated_at") {
      query = query.is("deactivated_at", null);
    } else if (activeFilter === "archived_at") {
      query = query.is("archived_at", null);
    }

    const { data, error } = await query.limit(STAGE_LOAD_MAX_CANDIDATES + 1);
    if (error) return { rows: [], error: { message: error.message, code: error.code } };
    return { rows: ((data ?? []) as Array<Record<string, unknown>>), error: null };
  };

  const runWithLocationFallback = async (
    activeFilter: "deactivated_at" | "archived_at" | "none",
  ): Promise<{ rows: Array<Record<string, unknown>>; error: { message: string; code?: string } | null }> => {
    const primary = await run(activeFilter, true);
    const hasLocationFilter = Boolean(input.locationId && input.locationId.trim().length > 0);
    if (primary.error || !hasLocationFilter || primary.rows.length > 0) return primary;
    const fallback = await run(activeFilter, false);
    if (!fallback.error) {
      warnings.push({
        code: "location_scope_fallback",
        message: "No students found for selected location; showing all tenant students.",
      });
    }
    return fallback;
  };

  const withDeactivated = await runWithLocationFallback("deactivated_at");
  if (!withDeactivated.error) {
    return { rows: withDeactivated.rows, warnings, error: null };
  }
  if (!isMissingColumnError(withDeactivated.error, "deactivated_at")) {
    return { rows: [], warnings, error: withDeactivated.error };
  }
  warnings.push({
    code: "schema_deactivated_at_missing",
    message: "Students schema missing deactivated_at; using fallback filters.",
  });

  const withArchived = await runWithLocationFallback("archived_at");
  if (!withArchived.error) {
    return { rows: withArchived.rows, warnings, error: null };
  }
  if (!isMissingColumnError(withArchived.error, "archived_at")) {
    return { rows: [], warnings, error: withArchived.error };
  }
  warnings.push({
    code: "schema_archived_at_missing",
    message: "Students schema missing archived_at; loading without archive filter.",
  });

  const withoutArchiveFilter = await runWithLocationFallback("none");
  if (!withoutArchiveFilter.error) {
    return { rows: withoutArchiveFilter.rows, warnings, error: null };
  }
  return { rows: [], warnings, error: withoutArchiveFilter.error };
}

type StudentStageProjection = {
  student: LifecycleStageSurfaceDTO["students"][number] | null;
  warnings: LifecycleStageSurfaceDTO["warnings"];
  degraded: boolean;
};

function buildFallbackStudent(
  row: Record<string, unknown>,
  stageId: LifecycleStageId,
): LifecycleStageSurfaceDTO["students"][number] | null {
  const id = getString(row, "id");
  const firstName = getString(row, "first_name");
  const lastName = getString(row, "last_name");
  const fullName = `${firstName} ${lastName}`.trim() || "Student";
  if (!id) return null;
  const contact = pickContact(row);
  return {
    id,
    name: fullName,
    family_email: contact.family_email,
    family_phone: contact.family_phone,
    blockers: [],
    nextStep: `Open their profile and finish the next step for ${defNameForStageId(stageId)}.`,
    riskBand: inferFallbackRiskBand(row),
  };
}

function defNameForStageId(stageId: LifecycleStageId): string {
  const def = getLifecycleStage(stageId);
  return def?.name ?? stageId;
}

async function projectStudentToStage(
  row: Record<string, unknown>,
  stageId: LifecycleStageId,
  deadline: number,
): Promise<StudentStageProjection> {
  const id = getString(row, "id");
  if (!id) {
    return {
      student: null,
      degraded: true,
      warnings: [{ code: "student_missing_id", message: "Skipped a student row with no id." }],
    };
  }
  const firstName = getString(row, "first_name");
  const lastName = getString(row, "last_name");
  const fullName = `${firstName} ${lastName}`.trim() || "Student";
  const rowContact = pickContact(row);

  if (Date.now() > deadline) {
    const fallbackStage = inferOperationalStage(row);
    if (fallbackStage !== stageId) {
      return {
        student: null,
        degraded: true,
        warnings: [{ code: "stage_budget_exceeded", message: "Lifecycle load budget exceeded; returned partial results." }],
      };
    }
    return {
      student: {
        id,
        name: fullName,
        family_email: rowContact.family_email,
        family_phone: rowContact.family_phone,
        blockers: ["This list is taking longer than usual to load. Refresh once, then try again."],
        nextStep: "Refresh the page to reload the full details.",
        riskBand: inferFallbackRiskBand(row),
      },
      degraded: true,
      warnings: [{ code: "student_context_timeout", message: `Fallback used for ${fullName}.` }],
    };
  }

  try {
    const ctx = await buildLifecycleContext(id);
    const computed = computeStage(ctx);
    const mergedRow = {
      ...row,
      ...(ctx.student ?? {}),
    } as Record<string, unknown>;
    const operationalStage = inferOperationalStage(mergedRow);
    const effectiveStage =
      stageRank(operationalStage) > stageRank(computed.stage.id) ? operationalStage : computed.stage.id;
    if (effectiveStage !== stageId) return { student: null, degraded: false, warnings: [] };
    const nextStep =
      effectiveStage === computed.stage.id
        ? nextStepLabel(computed)
        : `We placed them here based on their record. Double-check the details, then move them forward.`;
    const mergedContact = pickContact(mergedRow);
    return {
      student: {
        id,
        name: fullName,
        family_email: mergedContact.family_email ?? rowContact.family_email,
        family_phone: mergedContact.family_phone ?? rowContact.family_phone,
        blockers: summarizeBlockers(computed.blockers),
        nextStep,
        riskBand: ctx.riskBand,
      },
      degraded: false,
      warnings: [],
    };
  } catch (err) {
    const fallbackStage = inferOperationalStage(row);
    const normalized = normalizeError(err);
    if (fallbackStage !== stageId) {
      return {
        student: null,
        degraded: true,
        warnings: [{ code: "student_context_failed", message: `Skipped ${fullName}: ${normalized.message}` }],
      };
    }
    return {
      student: {
        id,
        name: fullName,
        family_email: rowContact.family_email,
        family_phone: rowContact.family_phone,
        blockers: [`We could not load everything for this student: ${normalized.message}`],
        nextStep: "Open their profile and fix missing info, then come back here.",
        riskBand: inferFallbackRiskBand(row),
      },
      degraded: true,
      warnings: [{ code: "student_fallback_used", message: `Used fallback context for ${fullName}.` }],
    };
  }
}

function compactWarnings(
  warnings: LifecycleStageSurfaceDTO["warnings"],
  maxItems = 8,
): LifecycleStageSurfaceDTO["warnings"] {
  const grouped = new Map<string, { code: string; message: string; count: number }>();
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.message}`;
    const current = grouped.get(key);
    if (current) {
      current.count += 1;
    } else {
      grouped.set(key, { ...warning, count: 1 });
    }
  }
  return Array.from(grouped.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems)
    .map((w) => ({
      code: w.code,
      message: w.count > 1 ? `${w.message} (${w.count})` : w.message,
    }));
}

export async function loadLifecycleStageSurface(
  stageId: string,
  tenantId: string,
  locationId?: string | null,
): Promise<{ ok: true; data: LifecycleStageSurfaceDTO } | { ok: false; error: string }> {
  try {
    const session = await requirePermission("students.read")();
    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId: locationId ?? null,
      autoRepairProfileLocation: true,
    });
    const normalizedTenantId = access.tenantId || tenantId.trim();
    if (!normalizedTenantId) {
      return { ok: false, error: "Missing tenant id (set ZIRO_DEV_TENANT_ID or NEXT_PUBLIC_ZIRO_DEV_TENANT_ID)." };
    }
    const resolvedLocationId =
      locationId && locationId.trim().length > 0
        ? assertLocationAllowed(access, locationId)
        : null;
    await logAudit("lifecycle.stage.load", {
      stageId,
      tenantId: normalizedTenantId,
    });
    assertValidStageId(stageId);
    const def = getLifecycleStage(stageId);
    if (!def) return { ok: false, error: "Unknown stage" };

    const candidates = await loadCandidateStudents({
      tenantId: normalizedTenantId,
      locationId: resolvedLocationId,
    });
    if (candidates.error) return { ok: false, error: candidates.error.message };

    const rows = candidates.rows;
    const warnings = [...candidates.warnings];
    let effectiveRows = rows;
    if (rows.length > STAGE_LOAD_MAX_CANDIDATES) {
      warnings.push({
        code: "candidate_limit_reached",
        message: `Lifecycle candidate set exceeded ${STAGE_LOAD_MAX_CANDIDATES}; results were truncated.`,
      });
      effectiveRows = rows.slice(0, STAGE_LOAD_MAX_CANDIDATES);
    }

    const stageScopedRows = effectiveRows.filter((row) => inferOperationalStage(row) === stageId);
    if (stageScopedRows.length === 0) {
      const agentDisplayName = formatAgentDisplayName(def.agent);
      return {
        ok: true,
        data: {
          stageId: def.id,
          stageName: def.name,
          stageDescription: def.description,
          agentKey: def.agent,
          agentDisplayName,
          students: [],
          agentSummary: `0 students in ${def.name}`,
          warnings: compactWarnings(warnings),
        },
      };
    }

    let rowsForContext = stageScopedRows;
    let overflowRows: Array<Record<string, unknown>> = [];
    if (stageScopedRows.length > STAGE_CONTEXT_MAX_ROWS) {
      rowsForContext = stageScopedRows.slice(0, STAGE_CONTEXT_MAX_ROWS);
      overflowRows = stageScopedRows.slice(STAGE_CONTEXT_MAX_ROWS);
      warnings.push({
        code: "context_overflow_fallback",
        message: `${overflowRows.length} students served via fast fallback to keep stage responsive.`,
      });
    }

    const deadline = Date.now() + STAGE_LOAD_BUDGET_MS;
    const projections = await mapWithConcurrency(
      rowsForContext,
      STAGE_LOAD_CONCURRENCY,
      async (row) => projectStudentToStage(row, stageId, deadline),
    );

    const matched = projections
      .map((projection) => projection.student)
      .filter((student): student is LifecycleStageSurfaceDTO["students"][number] => Boolean(student));
    const degradedCount = projections.filter((projection) => projection.degraded).length;
    for (const projection of projections) {
      for (const warning of projection.warnings) {
        warnings.push(warning);
      }
    }
    if (overflowRows.length > 0) {
      matched.push(
        ...overflowRows.flatMap((row) => {
          const student = buildFallbackStudent(row, stageId);
          return student ? [student] : [];
        }),
      );
    }
    const compactedWarnings = compactWarnings(warnings);
    matched.sort((a, b) => a.name.localeCompare(b.name));

    const agentDisplayName = formatAgentDisplayName(def.agent);
    const blocked = matched.filter((s) => s.blockers.length > 0).length;
    const degradedSummary = degradedCount > 0 ? ` · ${degradedCount} fallback` : "";
    const agentSummary = `${matched.length} student${matched.length === 1 ? "" : "s"} in ${def.name}${
      blocked ? ` · ${blocked} need attention` : ""
    }${degradedSummary}`;

    return {
      ok: true,
      data: {
        stageId: def.id,
        stageName: def.name,
        stageDescription: def.description,
        agentKey: def.agent,
        agentDisplayName,
        students: matched,
        agentSummary,
        warnings: compactedWarnings,
      },
    };
  } catch (e) {
    const normalized = normalizeError(e);
    return { ok: false, error: mapAuthError(normalized.message || "Failed to load stage") };
  }
}
