import "server-only";
import { registerJobHandler } from "./runner";
import type { JobRecord } from "./types";

let registered = false;

async function handleAutomationRun(job: JobRecord): Promise<void> {
  const tenantId =
    typeof job.payload.tenantId === "string"
      ? job.payload.tenantId
      : job.tenantId;
  const runId =
    typeof job.payload.runId === "string" ? job.payload.runId : null;
  if (!tenantId || !runId) {
    throw new Error("automation.run requires tenantId and runId");
  }
  const { executeRun } = await import("@/lib/automation/workflows/runtime");
  await executeRun(runId, tenantId);
}

export function ensureQueueHandlersRegistered(): void {
  if (registered) return;
  registerJobHandler("automation.run", handleAutomationRun);
  registered = true;
}
