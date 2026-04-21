"use server";
import { logAudit } from "@/lib/audit/log";
import { buildLifecycleContext } from "@/lib/lifecycle/buildContext";
import { computeStage } from "@/lib/lifecycle/computeStage";
import { getLifecycleStage } from "@/lib/lifecycle/stages";
import { assertValidStageId, summarizeBlockers } from "@/lib/lifecycle/helpers";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { getServiceClient } from "@/lib/supabase";
const STAGE_LOAD_CONCURRENCY = 8;
const STAGE_LOAD_MAX_CANDIDATES = 800;
const STAGE_LOAD_BUDGET_MS = 20000;
const STAGE_CONTEXT_MAX_ROWS = 80;
function formatAgentDisplayName(raw) {
    var _a;
    const table = {
        star: "STAR",
        ziro: "Ziro",
        ruby: "Ruby",
        stewie: "Stewie",
        vader: "Vader",
        bub: "Bub",
        sid: "Sid",
    };
    return (_a = table[raw]) !== null && _a !== void 0 ? _a : raw.replace(/-/g, " ");
}
function nextStepLabel(computed) {
    var _a, _b;
    if (computed.blockers.length > 0) {
        return (_b = (_a = computed.blockers[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Fix what needs attention first.";
    }
    if (computed.next)
        return `Move forward to ${computed.next.name}`;
    return `Finish ${computed.stage.name}`;
}
function normalizeError(err) {
    if (err instanceof Error)
        return { message: err.message, code: null };
    if (err && typeof err === "object") {
        const rec = err;
        const message = typeof rec.message === "string" ? rec.message : JSON.stringify(rec);
        const code = typeof rec.code === "string" ? rec.code : null;
        return { message: message || "Unknown error", code };
    }
    return { message: String(err !== null && err !== void 0 ? err : "Unknown error"), code: null };
}
function isMissingColumnError(err, column) {
    const normalized = normalizeError(err);
    if (normalized.code !== "42703")
        return false;
    return normalized.message.toLowerCase().includes(column.toLowerCase());
}
function mapAuthError(message) {
    if (message === "UNAUTHENTICATED")
        return "You are signed out. Sign in and reload.";
    if (message === "FORBIDDEN")
        return "Your account is missing lifecycle access for this workspace.";
    return message;
}
function getString(row, key) {
    const raw = row[key];
    return typeof raw === "string" ? raw.trim() : "";
}
function hasValue(row, key) {
    const raw = row[key];
    if (raw == null)
        return false;
    if (typeof raw === "string")
        return raw.trim().length > 0;
    return true;
}
function pickContact(row) {
    const email = getString(row, "email") || null;
    const phone = getString(row, "phone") || null;
    return { email, phone };
}
function inferFallbackRiskBand(row) {
    const status = getString(row, "status").toLowerCase();
    if (status === "inactive" || status === "churned" || status === "cancelled")
        return "high";
    if (hasValue(row, "enrollment_date"))
        return "medium";
    return "low";
}
const STAGE_ORDER = [
    "intake",
    "lead-work",
    "scheduling",
    "enrollment",
    "service-delivery",
    "relationship",
    "retention",
    "win-back",
];
function stageRank(stageId) {
    return STAGE_ORDER.indexOf(stageId);
}
function inferOperationalStage(row) {
    const status = getString(row, "status").toLowerCase();
    if (status === "inactive" || status === "former" || status === "cancelled" || status === "churned") {
        return "win-back";
    }
    const overdueAmountRaw = row.overdue_amount;
    const overdueAmount = typeof overdueAmountRaw === "number"
        ? overdueAmountRaw
        : typeof overdueAmountRaw === "string"
            ? Number(overdueAmountRaw)
            : 0;
    if (Number.isFinite(overdueAmount) && overdueAmount > 0)
        return "retention";
    const totalLessonsRaw = row.total_lessons_taken;
    const totalLessons = typeof totalLessonsRaw === "number"
        ? totalLessonsRaw
        : typeof totalLessonsRaw === "string"
            ? Number(totalLessonsRaw)
            : 0;
    if (Number.isFinite(totalLessons) && totalLessons >= 8)
        return "relationship";
    if ((Number.isFinite(totalLessons) && totalLessons >= 1) ||
        hasValue(row, "first_lesson_date") ||
        hasValue(row, "start_date")) {
        return "service-delivery";
    }
    if (hasValue(row, "teacher_id"))
        return "scheduling";
    if (hasValue(row, "intake_submission_id") || hasValue(row, "email") || hasValue(row, "phone")) {
        return "lead-work";
    }
    return "intake";
}
async function mapWithConcurrency(items, concurrency, worker) {
    if (items.length === 0)
        return [];
    const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
    const out = new Array(items.length);
    let cursor = 0;
    const runners = Array.from({ length: safeConcurrency }, async () => {
        while (true) {
            const index = cursor;
            cursor += 1;
            if (index >= items.length)
                break;
            out[index] = await worker(items[index], index);
        }
    });
    await Promise.all(runners);
    return out;
}
async function loadCandidateStudents(input) {
    const supabase = getServiceClient();
    const warnings = [];
    const run = async (activeFilter, enforceLocation) => {
        let query = supabase
            .from("students")
            .select("*")
            .eq("tenant_id", input.tenantId);
        if (enforceLocation && input.locationId && input.locationId.trim().length > 0) {
            query = query.eq("location_id", input.locationId.trim());
        }
        if (activeFilter === "deactivated_at") {
            query = query.is("deactivated_at", null);
        }
        else if (activeFilter === "archived_at") {
            query = query.is("archived_at", null);
        }
        const { data, error } = await query.limit(STAGE_LOAD_MAX_CANDIDATES + 1);
        if (error)
            return { rows: [], error: { message: error.message, code: error.code } };
        return { rows: (data !== null && data !== void 0 ? data : []), error: null };
    };
    const runWithLocationFallback = async (activeFilter) => {
        const primary = await run(activeFilter, true);
        const hasLocationFilter = Boolean(input.locationId && input.locationId.trim().length > 0);
        if (primary.error || !hasLocationFilter || primary.rows.length > 0)
            return primary;
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
function buildFallbackStudent(row, stageId) {
    const id = getString(row, "id");
    const firstName = getString(row, "first_name");
    const lastName = getString(row, "last_name");
    const fullName = `${firstName} ${lastName}`.trim() || "Student";
    if (!id)
        return null;
    const contact = pickContact(row);
    return {
        id,
        name: fullName,
        email: contact.email,
        phone: contact.phone,
        blockers: [],
        nextStep: `Open their profile and finish the next step for ${defNameForStageId(stageId)}.`,
        riskBand: inferFallbackRiskBand(row),
    };
}
function defNameForStageId(stageId) {
    var _a;
    const def = getLifecycleStage(stageId);
    return (_a = def === null || def === void 0 ? void 0 : def.name) !== null && _a !== void 0 ? _a : stageId;
}
async function projectStudentToStage(row, stageId, deadline) {
    var _a, _b, _c;
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
                email: rowContact.email,
                phone: rowContact.phone,
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
        const mergedRow = Object.assign(Object.assign({}, row), ((_a = ctx.student) !== null && _a !== void 0 ? _a : {}));
        const operationalStage = inferOperationalStage(mergedRow);
        const effectiveStage = stageRank(operationalStage) > stageRank(computed.stage.id) ? operationalStage : computed.stage.id;
        if (effectiveStage !== stageId)
            return { student: null, degraded: false, warnings: [] };
        const nextStep = effectiveStage === computed.stage.id
            ? nextStepLabel(computed)
            : `We placed them here based on their record. Double-check the details, then move them forward.`;
        const mergedContact = pickContact(mergedRow);
        return {
            student: {
                id,
                name: fullName,
                email: (_b = mergedContact.email) !== null && _b !== void 0 ? _b : rowContact.email,
                phone: (_c = mergedContact.phone) !== null && _c !== void 0 ? _c : rowContact.phone,
                blockers: summarizeBlockers(computed.blockers),
                nextStep,
                riskBand: ctx.riskBand,
            },
            degraded: false,
            warnings: [],
        };
    }
    catch (err) {
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
                email: rowContact.email,
                phone: rowContact.phone,
                blockers: [`We could not load everything for this student: ${normalized.message}`],
                nextStep: "Open their profile and fix missing info, then come back here.",
                riskBand: inferFallbackRiskBand(row),
            },
            degraded: true,
            warnings: [{ code: "student_fallback_used", message: `Used fallback context for ${fullName}.` }],
        };
    }
}
function compactWarnings(warnings, maxItems = 8) {
    const grouped = new Map();
    for (const warning of warnings) {
        const key = `${warning.code}:${warning.message}`;
        const current = grouped.get(key);
        if (current) {
            current.count += 1;
        }
        else {
            grouped.set(key, Object.assign(Object.assign({}, warning), { count: 1 }));
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
export async function loadLifecycleStageSurface(stageId, tenantId, locationId) {
    try {
        const session = await requirePermission("students.read")();
        const access = await resolveUserLocationAccess({
            session,
            preferredLocationId: locationId !== null && locationId !== void 0 ? locationId : null,
            autoRepairProfileLocation: true,
        });
        const normalizedTenantId = access.tenantId || tenantId.trim();
        if (!normalizedTenantId) {
            return { ok: false, error: "Missing tenant id (set ZIRO_DEV_TENANT_ID or NEXT_PUBLIC_ZIRO_DEV_TENANT_ID)." };
        }
        const resolvedLocationId = locationId && locationId.trim().length > 0
            ? assertLocationAllowed(access, locationId)
            : null;
        await logAudit("lifecycle.stage.load", {
            stageId,
            tenantId: normalizedTenantId,
        });
        assertValidStageId(stageId);
        const def = getLifecycleStage(stageId);
        if (!def)
            return { ok: false, error: "Unknown stage" };
        const candidates = await loadCandidateStudents({
            tenantId: normalizedTenantId,
            locationId: resolvedLocationId,
        });
        if (candidates.error)
            return { ok: false, error: candidates.error.message };
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
        let overflowRows = [];
        if (stageScopedRows.length > STAGE_CONTEXT_MAX_ROWS) {
            rowsForContext = stageScopedRows.slice(0, STAGE_CONTEXT_MAX_ROWS);
            overflowRows = stageScopedRows.slice(STAGE_CONTEXT_MAX_ROWS);
            warnings.push({
                code: "context_overflow_fallback",
                message: `${overflowRows.length} students served via fast fallback to keep stage responsive.`,
            });
        }
        const deadline = Date.now() + STAGE_LOAD_BUDGET_MS;
        const projections = await mapWithConcurrency(rowsForContext, STAGE_LOAD_CONCURRENCY, async (row) => projectStudentToStage(row, stageId, deadline));
        const matched = projections
            .map((projection) => projection.student)
            .filter((student) => Boolean(student));
        const degradedCount = projections.filter((projection) => projection.degraded).length;
        for (const projection of projections) {
            for (const warning of projection.warnings) {
                warnings.push(warning);
            }
        }
        if (overflowRows.length > 0) {
            matched.push(...overflowRows.flatMap((row) => {
                const student = buildFallbackStudent(row, stageId);
                return student ? [student] : [];
            }));
        }
        const compactedWarnings = compactWarnings(warnings);
        matched.sort((a, b) => a.name.localeCompare(b.name));
        const agentDisplayName = formatAgentDisplayName(def.agent);
        const blocked = matched.filter((s) => s.blockers.length > 0).length;
        const degradedSummary = degradedCount > 0 ? ` · ${degradedCount} fallback` : "";
        const agentSummary = `${matched.length} student${matched.length === 1 ? "" : "s"} in ${def.name}${blocked ? ` · ${blocked} need attention` : ""}${degradedSummary}`;
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
    }
    catch (e) {
        const normalized = normalizeError(e);
        return { ok: false, error: mapAuthError(normalized.message || "Failed to load stage") };
    }
}
