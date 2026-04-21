import { getServiceClient } from "@/lib/supabase";
import { runAutoActions } from "@/lib/ziro/auto/runner";
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
function getState() {
    const g = globalThis;
    if (!g.__ziro_auto_scheduler) {
        g.__ziro_auto_scheduler = {
            timer: null,
            intervalMs: DEFAULT_INTERVAL_MS,
            running: false,
            lastStartedAt: null,
            lastEndedAt: null,
            lastError: null,
            lastSummaries: [],
            runCount: 0,
        };
    }
    return g.__ziro_auto_scheduler;
}
async function listTenantIds() {
    const supabase = getServiceClient();
    const { data, error } = await supabase.from("tenants").select("id");
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : [])
        .map((row) => row.id)
        .filter((id) => typeof id === "string" && id.trim().length > 0);
}
async function runOnce() {
    const state = getState();
    if (state.running)
        return;
    state.running = true;
    state.lastStartedAt = new Date().toISOString();
    state.lastError = null;
    try {
        const tenantIds = await listTenantIds();
        const summaries = [];
        for (const tenantId of tenantIds) {
            try {
                const summary = await runAutoActions({ tenantId });
                summaries.push(summary);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Unknown tenant run error";
                state.lastError = `${tenantId}: ${message}`;
            }
        }
        state.lastSummaries = summaries;
        state.runCount += 1;
    }
    catch (error) {
        state.lastError =
            error instanceof Error ? error.message : "Unknown scheduler error";
    }
    finally {
        state.lastEndedAt = new Date().toISOString();
        state.running = false;
    }
}
export function startAutoScheduler(options) {
    const state = getState();
    const intervalMs = typeof (options === null || options === void 0 ? void 0 : options.intervalMs) === "number" && options.intervalMs > 0
        ? options.intervalMs
        : DEFAULT_INTERVAL_MS;
    if (state.timer) {
        return { started: false, intervalMs: state.intervalMs };
    }
    state.intervalMs = intervalMs;
    const timer = setInterval(() => {
        void runOnce();
    }, intervalMs);
    if (typeof timer.unref === "function") {
        timer.unref();
    }
    state.timer = timer;
    if ((options === null || options === void 0 ? void 0 : options.immediate) !== false) {
        void runOnce();
    }
    return { started: true, intervalMs };
}
export function stopAutoScheduler() {
    const state = getState();
    if (!state.timer)
        return { stopped: false };
    clearInterval(state.timer);
    state.timer = null;
    return { stopped: true };
}
export function isAutoSchedulerRunning() {
    const state = getState();
    return state.timer !== null;
}
export function getAutoSchedulerStatus() {
    const state = getState();
    return {
        running: state.timer !== null,
        inFlight: state.running,
        intervalMs: state.intervalMs,
        lastStartedAt: state.lastStartedAt,
        lastEndedAt: state.lastEndedAt,
        lastError: state.lastError,
        runCount: state.runCount,
        lastSummaries: state.lastSummaries,
    };
}
