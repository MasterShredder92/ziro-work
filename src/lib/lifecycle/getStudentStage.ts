import type { ComputedLifecycle } from "./types";
import { buildLifecycleContext } from "./buildContext";
import { computeStage } from "./computeStage";
import { emitStageTransition } from "./emitStageTransition";

/**
 * Compute and return the student's lifecycle stage.
 * Also emits a transition event when the stage changes.
 */
export async function getStudentStage(studentId: string): Promise<ComputedLifecycle> {
  const ctx = await buildLifecycleContext(studentId);

  // Compute with optional auto-advancement: if a stage is complete, has no blockers, and is configured
  // to auto-advance, we advance deterministically until we reach a non-complete stage.
  let computed = computeStage(ctx);
  let safety = 0;
  while (
    safety++ < 8 &&
    computed.autoAdvance &&
    computed.next &&
    computed.stage.exit(ctx)
  ) {
    // Fake the current stage by bumping the entry/exit reality is already true; we just treat "next"
    // as the computed stage for this call.
    computed = { ...computed, stage: computed.next, next: null, autoAdvance: false, blockers: [] };
  }

  await emitStageTransition({
    tenantId: ctx.tenantId,
    studentId: ctx.studentId,
    previousEvents: ctx.events,
    computed,
  });

  return computed;
}

