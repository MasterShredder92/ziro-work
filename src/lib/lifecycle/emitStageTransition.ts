import { getServiceClient } from "@/lib/supabase";
import type { ComputedLifecycle } from "./types";

export type StageTransitionResult =
  | { changed: false; from: string | null; to: string }
  | { changed: true; from: string | null; to: string };

function getPreviousStageFromEvents(events: Record<string, unknown>[]): string | null {
  for (const e of events) {
    const t = (e.event_type as string | undefined) ?? null;
    if (t !== "student_stage_changed") continue;
    const payload = (e.payload && typeof e.payload === "object" ? e.payload : {}) as Record<
      string,
      unknown
    >;
    const to = typeof payload?.to === "string" ? payload.to : null;
    if (to) return to;
  }
  return null;
}

/**
 * Compare previous vs new computed stage and, when changed, emit lifecycle events.
 * This is intentionally best-effort; it must not block the main thread.
 */
export async function emitStageTransition(input: {
  tenantId: string;
  studentId: string;
  previousEvents: Record<string, unknown>[];
  computed: ComputedLifecycle;
}): Promise<StageTransitionResult> {
  const prev = getPreviousStageFromEvents(input.previousEvents);
  const next = input.computed.stage.id;

  if (prev === next) {
    return { changed: false, from: prev, to: next };
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const inserts: Record<string, unknown>[] = [
    {
      tenant_id: input.tenantId,
      created_at: now,
      entity_type: "student",
      entity_id: input.studentId,
      event_type: "student_stage_changed",
      actor_id: null,
      payload: { from: prev, to: next },
    },
    {
      tenant_id: input.tenantId,
      created_at: now,
      entity_type: "lifecycle",
      entity_id: input.studentId,
      event_type: "lifecycle_stage_entry",
      actor_id: null,
      payload: { stage: next },
    },
  ];

  if (prev) {
    inserts.push({
      tenant_id: input.tenantId,
      created_at: now,
      entity_type: "lifecycle",
      entity_id: input.studentId,
      event_type: "lifecycle_stage_exit",
      actor_id: null,
      payload: { stage: prev },
    });
  }

  if (input.computed.blockers.length > 0) {
    inserts.push({
      tenant_id: input.tenantId,
      created_at: now,
      entity_type: "lifecycle",
      entity_id: input.studentId,
      event_type: "lifecycle_blockers_detected",
      actor_id: null,
      payload: { stage: next, blockers: input.computed.blockers },
    });
  }

  if (input.computed.autoAdvance && input.computed.next) {
    inserts.push({
      tenant_id: input.tenantId,
      created_at: now,
      entity_type: "lifecycle",
      entity_id: input.studentId,
      event_type: "lifecycle_auto_advance_ready",
      actor_id: null,
      payload: { from: next, to: input.computed.next.id },
    });
  }

  const { error } = await supabase.from("events").insert(inserts);
  if (error) {
    console.error("[LIFECYCLE] Failed to emit stage transition:", error.message);
  }

  return { changed: true, from: prev, to: next };
}

