import "server-only";
import { getServiceClient } from "@/lib/supabase";
import type {
  DeadLetterJobRecord,
  EnqueueArgs,
  JobRecord,
  JobRunRecord,
  JobStatus,
} from "./types";

type GlobalWithFlag = typeof globalThis & {
  __ziro_jobs_table_missing?: boolean;
};
const g = globalThis as GlobalWithFlag;

function missing(): boolean {
  return g.__ziro_jobs_table_missing === true;
}
function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; message?: unknown };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  return typeof e.message === "string" && /does not exist/i.test(e.message);
}
function markMissing(err: unknown): void {
  if (isMissingTableError(err)) g.__ziro_jobs_table_missing = true;
}

function rowToJob(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    tenantId: (row.tenant_id as string | null) ?? null,
    kind: String(row.kind),
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as JobStatus,
    priority: Number(row.priority ?? 100),
    runAt: String(row.run_at),
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 5),
    lastError: (row.last_error as string | null) ?? null,
    lockedBy: (row.locked_by as string | null) ?? null,
    lockedAt: (row.locked_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

function rowToDlq(row: Record<string, unknown>): DeadLetterJobRecord {
  return {
    id: String(row.id),
    originalJobId: String(row.original_job_id),
    tenantId: (row.tenant_id as string | null) ?? null,
    kind: String(row.kind),
    payload: (row.payload as Record<string, unknown>) ?? {},
    attempts: Number(row.attempts ?? 0),
    lastError: (row.last_error as string | null) ?? null,
    failedAt: String(row.failed_at),
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
  };
}

function rowToRun(row: Record<string, unknown>): JobRunRecord {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    attempt: Number(row.attempt),
    status: row.status as JobRunRecord["status"],
    startedAt: String(row.started_at),
    finishedAt: (row.finished_at as string | null) ?? null,
    durationMs: row.duration_ms === null ? null : Number(row.duration_ms),
    errorCode: (row.error_code as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    log: (row.log as Record<string, unknown> | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------
export async function enqueueJob(args: EnqueueArgs): Promise<JobRecord | null> {
  if (missing()) return null;
  const sb = getServiceClient();
  const payload = {
    tenant_id: args.tenantId ?? null,
    kind: args.kind,
    payload: args.payload,
    status: "pending",
    priority: args.priority ?? 100,
    run_at: args.runAt ?? new Date().toISOString(),
    attempts: 0,
    max_attempts: args.maxAttempts ?? 5,
  };
  try {
    const { data, error } = await sb.from("jobs").insert(payload).select("*").single();
    if (error) {
      markMissing(error);
      return null;
    }
    return data ? rowToJob(data) : null;
  } catch (err) {
    markMissing(err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// claim next due job (optimistic lock via CAS-ish update)
// ---------------------------------------------------------------------------
export async function claimNextJob(args: {
  kinds?: string[];
  workerId: string;
  now?: Date;
}): Promise<JobRecord | null> {
  if (missing()) return null;
  const sb = getServiceClient();
  const now = (args.now ?? new Date()).toISOString();

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
    const row = candidate.data?.[0];
    if (!row) return null;

    const { data, error } = await sb
      .from("jobs")
      .update({
        status: "running",
        locked_by: args.workerId,
        locked_at: now,
        updated_at: now,
        attempts: Number(row.attempts ?? 0) + 1,
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
  } catch (err) {
    markMissing(err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// complete / fail
// ---------------------------------------------------------------------------
export async function completeJob(jobId: string): Promise<void> {
  if (missing()) return;
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
  } catch (err) {
    markMissing(err);
  }
}

export async function failJob(args: {
  jobId: string;
  errorMessage: string;
  dead: boolean;
  nextRunAt?: string;
}): Promise<void> {
  if (missing()) return;
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
        run_at: args.dead ? now : (args.nextRunAt ?? now),
      })
      .eq("id", args.jobId);
  } catch (err) {
    markMissing(err);
  }
}

export async function recordJobRun(args: {
  jobId: string;
  attempt: number;
  status: JobRunRecord["status"];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  log?: Record<string, unknown> | null;
}): Promise<void> {
  if (missing()) return;
  const sb = getServiceClient();
  try {
    await sb.from("job_runs").insert({
      job_id: args.jobId,
      attempt: args.attempt,
      status: args.status,
      started_at: args.startedAt,
      finished_at: args.finishedAt,
      duration_ms: args.durationMs,
      error_code: args.errorCode ?? null,
      error_message: args.errorMessage ? args.errorMessage.slice(0, 2000) : null,
      log: args.log ?? null,
    });
  } catch (err) {
    markMissing(err);
  }
}

// ---------------------------------------------------------------------------
// dead-letter
// ---------------------------------------------------------------------------
export async function moveToDeadLetter(job: JobRecord): Promise<void> {
  if (missing()) return;
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
  } catch (err) {
    markMissing(err);
  }
}

// ---------------------------------------------------------------------------
// listing helpers for admin UI
// ---------------------------------------------------------------------------
export interface ListJobsArgs {
  statuses?: JobStatus[];
  kinds?: string[];
  tenantId?: string;
  limit?: number;
}

export async function listJobs(args: ListJobsArgs = {}): Promise<JobRecord[]> {
  if (missing()) return [];
  const sb = getServiceClient();
  let q = sb
    .from("jobs")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(Math.min(args.limit ?? 100, 500));
  if (args.statuses && args.statuses.length > 0) q = q.in("status", args.statuses);
  if (args.kinds && args.kinds.length > 0) q = q.in("kind", args.kinds);
  if (args.tenantId) q = q.eq("tenant_id", args.tenantId);
  try {
    const { data, error } = await q;
    if (error) {
      markMissing(error);
      return [];
    }
    return (data ?? []).map((row) => rowToJob(row as Record<string, unknown>));
  } catch (err) {
    markMissing(err);
    return [];
  }
}

export async function listDeadLetter(args: { tenantId?: string; limit?: number } = {}): Promise<DeadLetterJobRecord[]> {
  if (missing()) return [];
  const sb = getServiceClient();
  let q = sb
    .from("dead_letter_jobs")
    .select("*")
    .order("failed_at", { ascending: false })
    .limit(Math.min(args.limit ?? 100, 500));
  if (args.tenantId) q = q.eq("tenant_id", args.tenantId);
  try {
    const { data, error } = await q;
    if (error) {
      markMissing(error);
      return [];
    }
    return (data ?? []).map((row) => rowToDlq(row as Record<string, unknown>));
  } catch (err) {
    markMissing(err);
    return [];
  }
}

export async function requeueFromDeadLetter(id: string): Promise<JobRecord | null> {
  if (missing()) return null;
  const sb = getServiceClient();
  try {
    const { data: dlq, error: dlqErr } = await sb
      .from("dead_letter_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (dlqErr || !dlq) return null;

    const inserted = await enqueueJob({
      tenantId: (dlq.tenant_id as string | null) ?? null,
      kind: dlq.kind as string,
      payload: (dlq.payload as Record<string, unknown>) ?? {},
    });
    if (inserted) {
      await sb.from("dead_letter_jobs").update({ reviewed_at: new Date().toISOString() }).eq("id", id);
    }
    return inserted;
  } catch (err) {
    markMissing(err);
    return null;
  }
}

export async function getJobRuns(jobId: string, limit = 50): Promise<JobRunRecord[]> {
  if (missing()) return [];
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
    return (data ?? []).map((row) => rowToRun(row as Record<string, unknown>));
  } catch (err) {
    markMissing(err);
    return [];
  }
}
