import "server-only";
import { getServiceClient } from "@/lib/supabase";
const g = globalThis;
function missing() {
    return g.__ziro_jobs_table_missing === true;
}
function isMissingTableError(err) {
    if (!err || typeof err !== "object")
        return false;
    const e = err;
    if (e.code === "42P01" || e.code === "PGRST205")
        return true;
    return typeof e.message === "string" && /does not exist/i.test(e.message);
}
function markMissing(err) {
    if (isMissingTableError(err))
        g.__ziro_jobs_table_missing = true;
}
function rowToJob(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return {
        id: String(row.id),
        tenantId: (_a = row.tenant_id) !== null && _a !== void 0 ? _a : null,
        kind: String(row.kind),
        payload: (_b = row.payload) !== null && _b !== void 0 ? _b : {},
        status: row.status,
        priority: Number((_c = row.priority) !== null && _c !== void 0 ? _c : 100),
        runAt: String(row.run_at),
        attempts: Number((_d = row.attempts) !== null && _d !== void 0 ? _d : 0),
        maxAttempts: Number((_e = row.max_attempts) !== null && _e !== void 0 ? _e : 5),
        lastError: (_f = row.last_error) !== null && _f !== void 0 ? _f : null,
        lockedBy: (_g = row.locked_by) !== null && _g !== void 0 ? _g : null,
        lockedAt: (_h = row.locked_at) !== null && _h !== void 0 ? _h : null,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        completedAt: (_j = row.completed_at) !== null && _j !== void 0 ? _j : null,
    };
}
function rowToDlq(row) {
    var _a, _b, _c, _d, _e, _f;
    return {
        id: String(row.id),
        originalJobId: String(row.original_job_id),
        tenantId: (_a = row.tenant_id) !== null && _a !== void 0 ? _a : null,
        kind: String(row.kind),
        payload: (_b = row.payload) !== null && _b !== void 0 ? _b : {},
        attempts: Number((_c = row.attempts) !== null && _c !== void 0 ? _c : 0),
        lastError: (_d = row.last_error) !== null && _d !== void 0 ? _d : null,
        failedAt: String(row.failed_at),
        reviewedAt: (_e = row.reviewed_at) !== null && _e !== void 0 ? _e : null,
        reviewedBy: (_f = row.reviewed_by) !== null && _f !== void 0 ? _f : null,
    };
}
function rowToRun(row) {
    var _a, _b, _c, _d;
    return {
        id: String(row.id),
        jobId: String(row.job_id),
        attempt: Number(row.attempt),
        status: row.status,
        startedAt: String(row.started_at),
        finishedAt: (_a = row.finished_at) !== null && _a !== void 0 ? _a : null,
        durationMs: row.duration_ms === null ? null : Number(row.duration_ms),
        errorCode: (_b = row.error_code) !== null && _b !== void 0 ? _b : null,
        errorMessage: (_c = row.error_message) !== null && _c !== void 0 ? _c : null,
        log: (_d = row.log) !== null && _d !== void 0 ? _d : null,
    };
}
// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------
export async function enqueueJob(args) {
    var _a, _b, _c, _d;
    if (missing())
        return null;
    const sb = getServiceClient();
    const payload = {
        tenant_id: (_a = args.tenantId) !== null && _a !== void 0 ? _a : null,
        kind: args.kind,
        payload: args.payload,
        status: "pending",
        priority: (_b = args.priority) !== null && _b !== void 0 ? _b : 100,
        run_at: (_c = args.runAt) !== null && _c !== void 0 ? _c : new Date().toISOString(),
        attempts: 0,
        max_attempts: (_d = args.maxAttempts) !== null && _d !== void 0 ? _d : 5,
    };
    try {
        const { data, error } = await sb.from("jobs").insert(payload).select("*").single();
        if (error) {
            markMissing(error);
            return null;
        }
        return data ? rowToJob(data) : null;
    }
    catch (err) {
        markMissing(err);
        return null;
    }
}
// ---------------------------------------------------------------------------
// claim next due job (optimistic lock via CAS-ish update)
// ---------------------------------------------------------------------------
export async function claimNextJob(args) {
    var _a, _b, _c;
    if (missing())
        return null;
    const sb = getServiceClient();
    const now = ((_a = args.now) !== null && _a !== void 0 ? _a : new Date()).toISOString();
    try {
        let candidateQuery = sb
            .from("jobs")
            .select("*")
            .eq("status", "pending")
            .lte("run_at", now)
            .order("priority", { ascending: true })
            .order("run_at", { ascending: true })
            .limit(1);
        if (args.kinds && args.kinds.length > 0) {
            candidateQuery = candidateQuery.in("kind", args.kinds);
        }
        const candidate = await candidateQuery;
        if (candidate.error) {
            markMissing(candidate.error);
            return null;
        }
        const row = (_b = candidate.data) === null || _b === void 0 ? void 0 : _b[0];
        if (!row)
            return null;
        const { data, error } = await sb
            .from("jobs")
            .update({
            status: "running",
            locked_by: args.workerId,
            locked_at: now,
            updated_at: now,
            attempts: Number((_c = row.attempts) !== null && _c !== void 0 ? _c : 0) + 1,
        })
            .eq("id", row.id)
            .eq("status", "pending")
            .select("*")
            .single();
        if (error) {
            // Another worker probably won the race — safe to skip.
            return null;
        }
        return data ? rowToJob(data) : null;
    }
    catch (err) {
        markMissing(err);
        return null;
    }
}
// ---------------------------------------------------------------------------
// complete / fail
// ---------------------------------------------------------------------------
export async function completeJob(jobId) {
    if (missing())
        return;
    const sb = getServiceClient();
    const now = new Date().toISOString();
    try {
        await sb
            .from("jobs")
            .update({
            status: "succeeded",
            locked_by: null,
            locked_at: null,
            completed_at: now,
            updated_at: now,
            last_error: null,
        })
            .eq("id", jobId);
    }
    catch (err) {
        markMissing(err);
    }
}
export async function failJob(args) {
    var _a;
    if (missing())
        return;
    const sb = getServiceClient();
    const now = new Date().toISOString();
    try {
        await sb
            .from("jobs")
            .update({
            status: args.dead ? "dead" : "pending",
            locked_by: null,
            locked_at: null,
            last_error: args.errorMessage.slice(0, 2000),
            updated_at: now,
            run_at: args.dead ? now : ((_a = args.nextRunAt) !== null && _a !== void 0 ? _a : now),
        })
            .eq("id", args.jobId);
    }
    catch (err) {
        markMissing(err);
    }
}
export async function recordJobRun(args) {
    var _a, _b;
    if (missing())
        return;
    const sb = getServiceClient();
    try {
        await sb.from("job_runs").insert({
            job_id: args.jobId,
            attempt: args.attempt,
            status: args.status,
            started_at: args.startedAt,
            finished_at: args.finishedAt,
            duration_ms: args.durationMs,
            error_code: (_a = args.errorCode) !== null && _a !== void 0 ? _a : null,
            error_message: args.errorMessage ? args.errorMessage.slice(0, 2000) : null,
            log: (_b = args.log) !== null && _b !== void 0 ? _b : null,
        });
    }
    catch (err) {
        markMissing(err);
    }
}
// ---------------------------------------------------------------------------
// dead-letter
// ---------------------------------------------------------------------------
export async function moveToDeadLetter(job) {
    if (missing())
        return;
    const sb = getServiceClient();
    try {
        await sb.from("dead_letter_jobs").insert({
            original_job_id: job.id,
            tenant_id: job.tenantId,
            kind: job.kind,
            payload: job.payload,
            attempts: job.attempts,
            last_error: job.lastError ? job.lastError.slice(0, 2000) : null,
        });
    }
    catch (err) {
        markMissing(err);
    }
}
export async function listJobs(args = {}) {
    var _a;
    if (missing())
        return [];
    const sb = getServiceClient();
    let q = sb
        .from("jobs")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(Math.min((_a = args.limit) !== null && _a !== void 0 ? _a : 100, 500));
    if (args.statuses && args.statuses.length > 0)
        q = q.in("status", args.statuses);
    if (args.kinds && args.kinds.length > 0)
        q = q.in("kind", args.kinds);
    if (args.tenantId)
        q = q.eq("tenant_id", args.tenantId);
    try {
        const { data, error } = await q;
        if (error) {
            markMissing(error);
            return [];
        }
        return (data !== null && data !== void 0 ? data : []).map((row) => rowToJob(row));
    }
    catch (err) {
        markMissing(err);
        return [];
    }
}
export async function listDeadLetter(args = {}) {
    var _a;
    if (missing())
        return [];
    const sb = getServiceClient();
    let q = sb
        .from("dead_letter_jobs")
        .select("*")
        .order("failed_at", { ascending: false })
        .limit(Math.min((_a = args.limit) !== null && _a !== void 0 ? _a : 100, 500));
    if (args.tenantId)
        q = q.eq("tenant_id", args.tenantId);
    try {
        const { data, error } = await q;
        if (error) {
            markMissing(error);
            return [];
        }
        return (data !== null && data !== void 0 ? data : []).map((row) => rowToDlq(row));
    }
    catch (err) {
        markMissing(err);
        return [];
    }
}
export async function requeueFromDeadLetter(id) {
    var _a, _b;
    if (missing())
        return null;
    const sb = getServiceClient();
    try {
        const { data: dlq, error: dlqErr } = await sb
            .from("dead_letter_jobs")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (dlqErr || !dlq)
            return null;
        const inserted = await enqueueJob({
            tenantId: (_a = dlq.tenant_id) !== null && _a !== void 0 ? _a : null,
            kind: dlq.kind,
            payload: (_b = dlq.payload) !== null && _b !== void 0 ? _b : {},
        });
        if (inserted) {
            await sb.from("dead_letter_jobs").update({ reviewed_at: new Date().toISOString() }).eq("id", id);
        }
        return inserted;
    }
    catch (err) {
        markMissing(err);
        return null;
    }
}
export async function getJobRuns(jobId, limit = 50) {
    if (missing())
        return [];
    const sb = getServiceClient();
    try {
        const { data, error } = await sb
            .from("job_runs")
            .select("*")
            .eq("job_id", jobId)
            .order("attempt", { ascending: false })
            .limit(limit);
        if (error) {
            markMissing(error);
            return [];
        }
        return (data !== null && data !== void 0 ? data : []).map((row) => rowToRun(row));
    }
    catch (err) {
        markMissing(err);
        return [];
    }
}
