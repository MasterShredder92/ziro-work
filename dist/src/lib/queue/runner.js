import "server-only";
import { randomUUID } from "node:crypto";
import { logger } from "@/lib/observability/logger";
import { incrementCounter, observeHistogram } from "@/lib/observability/metrics";
import { claimNextJob, completeJob, failJob, moveToDeadLetter, recordJobRun } from "./queries";
import { computeBackoffMs, DEFAULT_RETRY } from "./retry";
const g = globalThis;
function getHandlers() {
    if (!g.__ziro_job_handlers)
        g.__ziro_job_handlers = new Map();
    return g.__ziro_job_handlers;
}
/**
 * Register a handler for a given `kind`. Call this at module-load time
 * from the subsystem that owns the job (messaging, automation, exports).
 */
export function registerJobHandler(kind, handler) {
    getHandlers().set(kind, handler);
}
/** Test/debug inspect. */
export function registeredKinds() {
    return Array.from(getHandlers().keys());
}
/**
 * Process up to N jobs in the current request. Intended to be invoked from
 * a cron-style endpoint (Vercel Cron, Supabase scheduled function, or an
 * external scheduler). This is the only place that actually *runs* jobs —
 * the rest of the app just enqueues them.
 */
export async function tick(options = {}) {
    var _a, _b;
    const workerId = (_a = options.workerId) !== null && _a !== void 0 ? _a : `worker_${randomUUID().slice(0, 8)}`;
    const max = Math.max(1, Math.min(50, (_b = options.maxJobs) !== null && _b !== void 0 ? _b : 10));
    const kinds = options.kinds && options.kinds.length > 0
        ? options.kinds
        : Array.from(getHandlers().keys());
    const result = { processed: 0, succeeded: 0, failed: 0, dead: 0, skipped: 0 };
    for (let i = 0; i < max; i++) {
        const job = await claimNextJob({ kinds, workerId });
        if (!job)
            break;
        result.processed += 1;
        await runOne(job);
        if (job) {
            // The counter is maintained inside runOne via the specific status path.
        }
    }
    return result;
    async function runOne(job) {
        const handler = getHandlers().get(job.kind);
        const startedAt = new Date().toISOString();
        const startedMs = Date.now();
        const log = logger.child({ subsystem: "queue", route: `job.${job.kind}` });
        if (!handler) {
            result.skipped += 1;
            const msg = `No handler registered for job.kind=${job.kind}`;
            log.warn("job.skipped", { jobId: job.id, kind: job.kind });
            await failJob({ jobId: job.id, errorMessage: msg, dead: job.attempts >= job.maxAttempts });
            if (job.attempts >= job.maxAttempts) {
                await moveToDeadLetter(job);
            }
            await recordJobRun({
                jobId: job.id,
                attempt: job.attempts,
                status: "failed",
                startedAt,
                finishedAt: new Date().toISOString(),
                durationMs: Date.now() - startedMs,
                errorCode: "NO_HANDLER",
                errorMessage: msg,
            });
            return;
        }
        try {
            await handler(job);
            result.succeeded += 1;
            const finishedMs = Date.now();
            await completeJob(job.id);
            await recordJobRun({
                jobId: job.id,
                attempt: job.attempts,
                status: "succeeded",
                startedAt,
                finishedAt: new Date(finishedMs).toISOString(),
                durationMs: finishedMs - startedMs,
            });
            observeHistogram("jobs_duration_ms", finishedMs - startedMs, {
                kind: job.kind,
                outcome: "ok",
            });
            incrementCounter("jobs_total", { kind: job.kind, status: "succeeded" });
            log.info("job.succeeded", { jobId: job.id, kind: job.kind, attempt: job.attempts });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const finishedMs = Date.now();
            const isLastAttempt = job.attempts >= job.maxAttempts;
            if (isLastAttempt) {
                result.dead += 1;
                await failJob({ jobId: job.id, errorMessage: message, dead: true });
                await moveToDeadLetter(Object.assign(Object.assign({}, job), { lastError: message }));
                incrementCounter("jobs_total", { kind: job.kind, status: "dead" });
                log.error("job.dead_letter", {
                    jobId: job.id,
                    kind: job.kind,
                    attempt: job.attempts,
                    error: message,
                });
            }
            else {
                result.failed += 1;
                const nextRunAt = new Date(Date.now() + computeBackoffMs(job.attempts, DEFAULT_RETRY)).toISOString();
                await failJob({ jobId: job.id, errorMessage: message, dead: false, nextRunAt });
                incrementCounter("jobs_total", { kind: job.kind, status: "retry" });
                log.warn("job.retry_scheduled", {
                    jobId: job.id,
                    kind: job.kind,
                    attempt: job.attempts,
                    nextRunAt,
                    error: message,
                });
            }
            await recordJobRun({
                jobId: job.id,
                attempt: job.attempts,
                status: "failed",
                startedAt,
                finishedAt: new Date(finishedMs).toISOString(),
                durationMs: finishedMs - startedMs,
                errorCode: err instanceof Error ? err.name : undefined,
                errorMessage: message,
            });
            observeHistogram("jobs_duration_ms", finishedMs - startedMs, {
                kind: job.kind,
                outcome: "error",
            });
        }
    }
}
