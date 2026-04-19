import type { LifecycleBlocker, LifecycleStageId } from "./types";
import { lifecycleStages } from "./stages";

export function isLifecycleStageId(x: unknown): x is LifecycleStageId {
  return lifecycleStages.some((s) => s.id === x);
}

export function assertValidStageId(id: string): asserts id is LifecycleStageId {
  if (!isLifecycleStageId(id)) throw new Error(`Invalid lifecycle stage id: ${id}`);
}

export function listStageIds(): LifecycleStageId[] {
  return lifecycleStages.map((s) => s.id);
}

export function getNextStageId(id: LifecycleStageId): LifecycleStageId | null {
  const idx = lifecycleStages.findIndex((s) => s.id === id);
  if (idx < 0) return null;
  return (lifecycleStages[idx + 1]?.id ?? null) as LifecycleStageId | null;
}

export function summarizeBlockers(blockers: LifecycleBlocker[]): string[] {
  return blockers.map((b) => b.message);
}

