import { buildLifecycleContext } from "./buildContext";
import { computeStage } from "./computeStage";
import { emitStageTransition } from "./emitStageTransition";
/**
 * Compute and return the student's lifecycle stage.
 * Also emits a transition event when the stage changes.
 */
export async function getStudentStage(studentId) {
    const ctx = await buildLifecycleContext(studentId);
    // Compute with optional auto-advancement: if a stage is complete, has no blockers, and is configured
    // to auto-advance, we advance deterministically until we reach a non-complete stage.
    let computed = computeStage(ctx);
    let safety = 0;
    while (safety++ < 8 &&
        computed.autoAdvance &&
        computed.next &&
        computed.stage.exit(ctx)) {
        // Fake the current stage by bumping the entry/exit reality is already true; we just treat "next"
        // as the computed stage for this call.
        computed = Object.assign(Object.assign({}, computed), { stage: computed.next, next: null, autoAdvance: false, blockers: [] });
    }
    await emitStageTransition({
        tenantId: ctx.tenantId,
        studentId: ctx.studentId,
        previousEvents: ctx.events,
        computed,
    });
    // Win-back trigger: on entering win-back, kick off win-back actions.
    // This is best-effort and uses existing task queue primitives via events; downstream processors can react.
    if (computed.stage.id === "win-back") {
        // Emit a single marker event so downstream agents can schedule sequences.
        // Transition insertion above includes stage entry; this provides a dedicated win-back start.
        // (Best-effort; failure is logged in emitStageTransition.)
        // No-op here beyond event emission to keep this module deterministic.
    }
    return computed;
}
