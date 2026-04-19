import { autoActionPacks } from "./actions";
import type {
  AutoActionContext,
  AutoActionRunRecord,
  AutoActionRunSummary,
} from "./types";

export type RunAutoActionsInput = {
  tenantId: string;
  profileId?: string | null;
  now?: Date;
  packKeys?: string[];
};

function resolvePacks(packKeys?: string[]) {
  if (!packKeys || packKeys.length === 0) {
    return Object.values(autoActionPacks);
  }
  const requested = new Set(packKeys);
  return Object.values(autoActionPacks).filter((pack) => requested.has(pack.key));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export async function runAutoActions(
  input: RunAutoActionsInput,
): Promise<AutoActionRunSummary> {
  const tenantId = (input.tenantId ?? "").trim();
  if (!tenantId) {
    throw new Error("runAutoActions: tenantId is required");
  }
  const now = input.now ?? new Date();
  const profileId =
    typeof input.profileId === "string" && input.profileId.trim().length > 0
      ? input.profileId
      : null;
  const ctx: AutoActionContext = { tenantId, profileId, now };
  const packs = resolvePacks(input.packKeys);
  const summaryStart = new Date();
  const results: AutoActionRunRecord[] = [];

  for (const pack of packs) {
    for (const action of pack.actions) {
      const startedAt = new Date();
      try {
        const result = await action.handler(ctx);
        const endedAt = new Date();
        results.push({
          pack: pack.key,
          key: action.key,
          triggered: Boolean(result?.triggered),
          details: result?.details,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          durationMs: endedAt.getTime() - startedAt.getTime(),
        });
      } catch (error) {
        const endedAt = new Date();
        results.push({
          pack: pack.key,
          key: action.key,
          triggered: false,
          error: toErrorMessage(error),
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          durationMs: endedAt.getTime() - startedAt.getTime(),
        });
      }
    }
  }

  const summaryEnd = new Date();
  return {
    tenantId,
    profileId,
    startedAt: summaryStart.toISOString(),
    endedAt: summaryEnd.toISOString(),
    durationMs: summaryEnd.getTime() - summaryStart.getTime(),
    results,
  };
}
