import { createEvent, deleteEvent, getEvent, listEvents, listEventsWithConflicts, updateEvent, } from "./queries";
import { cancelSeries, generateOccurrences, materializeSeries, splitSeries, updateSeries, } from "./recurrence";
import { computeEventConflicts, detectEventConflicts, getTeacherWeeklyAvailability, setTeacherAvailability, upsertTeacherAvailabilitySlot, } from "./availability";
import { assignRoomToEvent, autoResolveRoomConflict, releaseRoomBooking, suggestRoomsForEvent, } from "./bookings";
import { notifyScheduleChange, scheduleEventReminder, syncEventToAttendance, triggerBillingForEvent, } from "./integrations";
import { recordUsage } from "@/lib/billing/billingOps";
/**
 * High-level façade combining queries + integrations so callers on routes /
 * pages / agents can work against a single surface.
 */
function defaultWeekRange() {
    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 13);
    return { start: start.toISOString(), end: end.toISOString() };
}
export async function getScheduleDashboard(tenantId, range, locationId) {
    const resolved = range !== null && range !== void 0 ? range : defaultWeekRange();
    const { events, conflicts } = await listEventsWithConflicts(tenantId, {
        range: resolved,
        locationId: locationId !== null && locationId !== void 0 ? locationId : undefined,
        limit: 2000,
    });
    const kpis = {
        totalEvents: events.length,
        conflictCount: conflicts.length,
        cancelled: events.filter((e) => e.status === "cancelled").length,
        completed: events.filter((e) => e.status === "completed").length,
        scheduled: events.filter((e) => e.status === "scheduled" || e.status === "confirmed").length,
    };
    return {
        tenantId,
        locationId: locationId !== null && locationId !== void 0 ? locationId : null,
        range: resolved,
        events,
        conflicts,
        generatedAt: new Date().toISOString(),
        kpis,
    };
}
export async function createEventWithSideEffects(tenantId, input, opts) {
    const event = await createEvent(tenantId, input, opts);
    await recordUsage({
        tenantId,
        metric: "appointments",
        amount: 1,
        source: "scheduling",
        metadata: { eventId: event.id, kind: event.kind },
    }).catch(() => null);
    await notifyScheduleChange(tenantId, event, "created");
    if ((opts === null || opts === void 0 ? void 0 : opts.scheduleReminder) !== false) {
        await scheduleEventReminder(tenantId, event);
    }
    return event;
}
export async function updateEventWithSideEffects(tenantId, id, patch, opts) {
    const before = await getEvent(tenantId, id);
    const event = await updateEvent(tenantId, id, patch, opts);
    const movedInTime = before &&
        (before.startTime !== event.startTime || before.endTime !== event.endTime);
    await notifyScheduleChange(tenantId, event, movedInTime ? "rescheduled" : "updated");
    if (event.status === "completed" || event.status === "no_show") {
        await syncEventToAttendance(tenantId, event);
    }
    if (event.status === "completed") {
        await triggerBillingForEvent(tenantId, event);
    }
    return event;
}
export async function cancelEvent(tenantId, id, opts) {
    const current = await getEvent(tenantId, id);
    if (!current)
        return { ok: true, event: null };
    if (opts === null || opts === void 0 ? void 0 : opts.hardDelete) {
        await deleteEvent(tenantId, id);
        await notifyScheduleChange(tenantId, current, "cancelled");
        return { ok: true, event: null };
    }
    const updated = await updateEvent(tenantId, id, { status: "cancelled" }, { allowConflict: true });
    await notifyScheduleChange(tenantId, updated, "cancelled");
    return { ok: true, event: updated };
}
export async function createRecurringSeries(tenantId, rule, template, opts) {
    const { rule: newRule, events } = await materializeSeries(tenantId, rule, template, opts);
    for (const ev of events) {
        await notifyScheduleChange(tenantId, ev, "created");
    }
    return { rule: newRule, events };
}
export { listEvents, getEvent, createEvent, updateEvent, deleteEvent, listEventsWithConflicts, cancelSeries, updateSeries, splitSeries, generateOccurrences, detectEventConflicts, computeEventConflicts, getTeacherWeeklyAvailability, setTeacherAvailability, upsertTeacherAvailabilitySlot, assignRoomToEvent, autoResolveRoomConflict, releaseRoomBooking, suggestRoomsForEvent, syncEventToAttendance, triggerBillingForEvent, scheduleEventReminder, notifyScheduleChange, };
