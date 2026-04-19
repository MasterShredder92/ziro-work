import type { ComputedLifecycle, LifecycleContext, LifecycleStageDefinition } from "./types";
import { lifecycleStages } from "./stages";

export function computeStage(context: LifecycleContext): ComputedLifecycle {
  const stages = lifecycleStages;

  // Find the first stage that is "ready" but not yet "complete".
  // The pipeline is ordered; entry gates being "in" the stage, exit gates being "done".
  let idx = 0;
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (!s.entry(context)) {
      idx = Math.max(0, i - 1);
      break;
    }
    if (s.exit(context)) {
      idx = Math.min(stages.length - 1, i + 1);
      continue;
    }
    idx = i;
    break;
  }

  if (idx >= stages.length) idx = stages.length - 1;
  const stage = stages[idx];

  const blockers = stage.blockers(context);

  const next: LifecycleStageDefinition | null =
    idx + 1 < stages.length && blockers.length === 0 ? stages[idx + 1] : null;

  // Auto-advance is only meaningful when there are no blockers.
  const autoAdvance = stage.autoAdvance && blockers.length === 0;

  return { stage, blockers, next, autoAdvance };
}

