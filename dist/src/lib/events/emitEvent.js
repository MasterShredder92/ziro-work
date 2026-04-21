/**
 * emitEvent — central utility for emitting lifecycle events into the events table.
 * All API routes should call this after state-changing operations.
 */
import { getServiceClient } from "@/lib/supabase";
export async function emitEvent(event) {
    var _a, _b;
    try {
        const supabase = getServiceClient();
        const { error } = await supabase.from("events").insert({
            tenant_id: event.tenantId,
            event_type: event.eventType,
            entity_type: event.entityType,
            entity_id: event.entityId,
            payload: (_a = event.payload) !== null && _a !== void 0 ? _a : {},
            actor_id: (_b = event.actorId) !== null && _b !== void 0 ? _b : null,
            created_at: new Date().toISOString(),
        });
        if (error) {
            console.error(`[emitEvent] Failed to emit ${event.eventType}:`, error.message);
        }
    }
    catch (err) {
        // Best-effort — never throw, never break the calling route
        console.error(`[emitEvent] Unexpected error for ${event.eventType}:`, err);
    }
}
