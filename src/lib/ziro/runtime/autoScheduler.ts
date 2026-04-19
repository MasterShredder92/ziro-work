import { getServiceClient } from "@/lib/supabase";
import { runAutoActions } from "@/lib/ziro/auto/runner";
import type { AutoActionRunSummary } from "@/lib/ziro/auto/types";

type SchedulerState = {
  timer: NodeJS.Timeout | null;
  intervalMs: number;
  running: boolean;
  lastStartedAt: string | null;
  lastEndedAt: string | null;
  lastError: string | null;
  lastSummaries: AutoActionRunSummary[];
  runCount: number;
};

type GlobalWithScheduler = typeof globalThis & {
  __ziro_auto_scheduler?: SchedulerState;
};

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

function getState(): SchedulerState {
  const g = globalThis as GlobalWithScheduler;
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

async function listTenantIds(): Promise<string[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("tenants").select("id");
  if (error) throw error;
  return (data ?? [])
    .map((row) => (row as { id?: string }).id)
    .filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0,
    );
}

async function runOnce(): Promise<void> {
  const state = getState();
  if (state.running) return;
  state.running = true;
  state.lastStartedAt = new Date().toISOString();
  state.lastError = null;

  try {
    const tenantIds = await listTenantIds();
    const summaries: AutoActionRunSummary[] = [];
    for (const tenantId of tenantIds) {
      try {
        const summary = await runAutoActions({ tenantId });
        summaries.push(summary);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown tenant run error";
        state.lastError = `${tenantId}: ${message}`;
      }
    }
    state.lastSummaries = summaries;
    state.runCount += 1;
  } catch (error) {
    state.lastError =
      error instanceof Error ? error.message : "Unknown scheduler error";
  } finally {
    state.lastEndedAt = new Date().toISOString();
    state.running = false;
  }
}

export type StartAutoSchedulerOptions = {
  intervalMs?: number;
  immediate?: boolean;
};

export function startAutoScheduler(
  options?: StartAutoSchedulerOptions,
): { started: boolean; intervalMs: number } {
  const state = getState();
  const intervalMs =
    typeof options?.intervalMs === "number" && options.intervalMs > 0
      ? options.intervalMs
      : DEFAULT_INTERVAL_MS;

  if (state.timer) {
    return { started: false, intervalMs: state.intervalMs };
  }

  state.intervalMs = intervalMs;
  const timer = setInterval(() => {
    void runOnce();
  }, intervalMs);
  if (typeof (timer as NodeJS.Timeout).unref === "function") {
    (timer as NodeJS.Timeout).unref();
  }
  state.timer = timer;

  if (options?.immediate !== false) {
    void runOnce();
  }

  return { started: true, intervalMs };
}

export function stopAutoScheduler(): { stopped: boolean } {
  const state = getState();
  if (!state.timer) return { stopped: false };
  clearInterval(state.timer);
  state.timer = null;
  return { stopped: true };
}

export function isAutoSchedulerRunning(): boolean {
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
