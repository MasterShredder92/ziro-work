import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  listEventsWithConflicts,
  updateEvent,
  type CreateEventInput,
  type ListEventsInput,
} from "./queries";
import {
  cancelSeries,
  generateOccurrences,
  materializeSeries,
  splitSeries,
  updateSeries,
  type SeriesEventTemplate,
} from "./recurrence";
import {
  computeEventConflicts,
  detectEventConflicts,
  getTeacherWeeklyAvailability,
  setTeacherAvailability,
  upsertTeacherAvailabilitySlot,
} from "./availability";
import {
  assignRoomToEvent,
  autoResolveRoomConflict,
  releaseRoomBooking,
  suggestRoomsForEvent,
} from "./bookings";
import {
  notifyScheduleChange,
  scheduleEventReminder,
  syncEventToAttendance,
  triggerBillingForEvent,
} from "./integrations";
import { recordUsage } from "@/lib/billing/billingOps";
import type {
  LessonEvent,
  LessonEventUpdate,
  RecurringRuleInsert,
  ScheduleConflict,
  ScheduleRange,
} from "./types";

/**
 * High-level façade combining queries + integrations so callers on routes /
 * pages / agents can work against a single surface.
 */

function defaultWeekRange(): ScheduleRange {
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 13);
  return { start: start.toISOString(), end: end.toISOString() };
}

export type ScheduleDashboardData = {
  tenantId: string;
  locationId: string | null;
  range: ScheduleRange;
  events: LessonEvent[];
  conflicts: ScheduleConflict[];
  generatedAt: string;
  kpis: {
    totalEvents: number;
    conflictCount: number;
    cancelled: number;
    completed: number;
    scheduled: number;
  };
};

export async function getScheduleDashboard(
  tenantId: string,
  range?: ScheduleRange,
  locationId?: string | null,
): Promise<ScheduleDashboardData> {
  const resolved = range ?? defaultWeekRange();
  const { events, conflicts } = await listEventsWithConflicts(tenantId, {
    range: resolved,
    locationId: locationId ?? undefined,
    limit: 2000,
  });

  const kpis = {
    totalEvents: events.length,
    conflictCount: conflicts.length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
    completed: events.filter((e) => e.status === "completed").length,
    scheduled: events.filter(
      (e) => e.status === "scheduled" || e.status === "confirmed",
    ).length,
  };

  return {
    tenantId,
    locationId: locationId ?? null,
    range: resolved,
    events,
    conflicts,
    generatedAt: new Date().toISOString(),
    kpis,
  };
}

export async function createEventWithSideEffects(
  tenantId: string,
  input: CreateEventInput,
  opts?: { allowConflict?: boolean; scheduleReminder?: boolean },
): Promise<LessonEvent> {
  const event = await createEvent(tenantId, input, opts);
  await recordUsage({
    tenantId,
    metric: "appointments",
    amount: 1,
    source: "scheduling",
    metadata: { eventId: event.id, kind: event.kind },
  }).catch(() => null);
  await notifyScheduleChange(tenantId, event, "created");
  if (opts?.scheduleReminder !== false) {
    await scheduleEventReminder(tenantId, event);
  }
  return event;
}

export async function updateEventWithSideEffects(
  tenantId: string,
  id: string,
  patch: LessonEventUpdate,
  opts?: { allowConflict?: boolean },
): Promise<LessonEvent> {
  const before = await getEvent(tenantId, id);
  const event = await updateEvent(tenantId, id, patch, opts);

  const movedInTime =
    before &&
    (before.startTime !== event.startTime || before.endTime !== event.endTime);
  await notifyScheduleChange(
    tenantId,
    event,
    movedInTime ? "rescheduled" : "updated",
  );

  if (event.status === "completed" || event.status === "no_show") {
    await syncEventToAttendance(tenantId, event);
  }
  if (event.status === "completed") {
    await triggerBillingForEvent(tenantId, event);
  }
  return event;
}

export async function cancelEvent(
  tenantId: string,
  id: string,
  opts?: { hardDelete?: boolean },
): Promise<{ ok: true; event?: LessonEvent | null }> {
  const current = await getEvent(tenantId, id);
  if (!current) return { ok: true, event: null };

  if (opts?.hardDelete) {
    await deleteEvent(tenantId, id);
    await notifyScheduleChange(tenantId, current, "cancelled");
    return { ok: true, event: null };
  }

  const updated = await updateEvent(
    tenantId,
    id,
    { status: "cancelled" },
    { allowConflict: true },
  );
  await notifyScheduleChange(tenantId, updated, "cancelled");
  return { ok: true, event: updated };
}

export async function createRecurringSeries(
  tenantId: string,
  rule: RecurringRuleInsert,
  template: SeriesEventTemplate,
  opts?: { horizonEnd?: string; maxOccurrences?: number },
) {
  const { rule: newRule, events } = await materializeSeries(
    tenantId,
    rule,
    template,
    opts,
  );
  for (const ev of events) {
    await notifyScheduleChange(tenantId, ev, "created");
  }
  return { rule: newRule, events };
}

export {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  listEventsWithConflicts,
  cancelSeries,
  updateSeries,
  splitSeries,
  generateOccurrences,
  detectEventConflicts,
  computeEventConflicts,
  getTeacherWeeklyAvailability,
  setTeacherAvailability,
  upsertTeacherAvailabilitySlot,
  assignRoomToEvent,
  autoResolveRoomConflict,
  releaseRoomBooking,
  suggestRoomsForEvent,
  syncEventToAttendance,
  triggerBillingForEvent,
  scheduleEventReminder,
  notifyScheduleChange,
  type ListEventsInput,
  type CreateEventInput,
  type SeriesEventTemplate,
  type ScheduleRange,
};
