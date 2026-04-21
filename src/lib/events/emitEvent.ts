/**
 * emitEvent — central utility for emitting lifecycle events into the events table.
 * All API routes should call this after state-changing operations.
 */
import { getServiceClient } from "@/lib/supabase";

export interface EventPayload {
  tenantId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
  actorId?: string | null;
}

export async function emitEvent(event: EventPayload): Promise<void> {
  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("events").insert({
      tenant_id: event.tenantId,
      event_type: event.eventType,
      entity_type: event.entityType,
      entity_id: event.entityId,
      payload: event.payload ?? {},
      actor_id: event.actorId ?? null,
      created_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`[emitEvent] Failed to emit ${event.eventType}:`, error.message);
    }
  } catch (err) {
    // Best-effort — never throw, never break the calling route
    console.error(`[emitEvent] Unexpected error for ${event.eventType}:`, err);
  }
}
