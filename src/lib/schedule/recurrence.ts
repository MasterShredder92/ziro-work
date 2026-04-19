import type {
  LessonEvent,
  LessonEventInsert,
  RecurringRule,
  RecurringRuleInsert,
  RecurringRuleUpdate,
} from "./types";
import {
  createRecurringRule as createRule,
  deleteRecurringRule as deleteRule,
  getRecurringRule,
  updateRecurringRule as updateRule,
} from "@data/recurringRules";
import {
  createLessonEvent,
  deleteLessonEventsByRecurrence,
  listLessonEvents,
  updateLessonEvent,
} from "@data/lessonEvents";

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function addMonths(d: Date, n: number): Date {
  const next = new Date(d);
  next.setMonth(next.getMonth() + n);
  return next;
}

function parseISODate(s: string): Date {
  const d = new Date(s.length <= 10 ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

export type GenerateOccurrencesOptions = {
  rule: RecurringRule;
  horizonEnd?: string;
  maxOccurrences?: number;
};

/**
 * Enumerate occurrences (as ISO date strings in UTC) for a recurring rule
 * inside a bounded window. Does not create events — see `materializeSeries`.
 */
export function generateOccurrences(opts: GenerateOccurrencesOptions): string[] {
  const { rule } = opts;
  const maxOccurrences = Math.max(1, Math.min(1000, opts.maxOccurrences ?? 365));
  const start = parseISODate(rule.startDate);
  const endDate = rule.endDate ? parseISODate(rule.endDate) : null;
  const horizon = opts.horizonEnd ? parseISODate(opts.horizonEnd) : null;
  const limitCount = rule.count && rule.count > 0 ? rule.count : maxOccurrences;
  const exceptions = new Set(rule.exceptions ?? []);

  const out: string[] = [];
  const interval = Math.max(1, rule.interval || 1);

  if (rule.frequency === "daily") {
    let cursor = new Date(start);
    while (out.length < limitCount) {
      if (endDate && cursor > endDate) break;
      if (horizon && cursor > horizon) break;
      const key = cursor.toISOString().slice(0, 10);
      if (!exceptions.has(key)) out.push(cursor.toISOString());
      cursor = addDays(cursor, interval);
    }
    return out;
  }

  if (rule.frequency === "weekly") {
    const weekdays = (rule.byWeekday && rule.byWeekday.length > 0
      ? rule.byWeekday
      : [start.getUTCDay()]
    ).slice().sort((a, b) => a - b);
    let weekStart = new Date(start);
    weekStart = addDays(weekStart, -weekStart.getUTCDay());
    while (out.length < limitCount) {
      for (const dow of weekdays) {
        const day = addDays(weekStart, dow);
        if (day < start) continue;
        if (endDate && day > endDate) return out;
        if (horizon && day > horizon) return out;
        const key = day.toISOString().slice(0, 10);
        if (!exceptions.has(key)) out.push(day.toISOString());
        if (out.length >= limitCount) return out;
      }
      weekStart = addDays(weekStart, 7 * interval);
      if (horizon && weekStart > horizon) break;
    }
    return out;
  }

  // monthly
  let cursor = new Date(start);
  while (out.length < limitCount) {
    if (endDate && cursor > endDate) break;
    if (horizon && cursor > horizon) break;
    const key = cursor.toISOString().slice(0, 10);
    if (!exceptions.has(key)) out.push(cursor.toISOString());
    cursor = addMonths(cursor, interval);
  }
  return out;
}

export type SeriesEventTemplate = Omit<
  LessonEventInsert,
  "startTime" | "endTime" | "recurrenceId" | "id"
> & {
  durationMinutes: number;
  startTimeOfDay: string; // HH:MM[:SS]
};

/**
 * Create a recurring rule plus its child LessonEvent occurrences within
 * the provided horizon.
 */
export async function materializeSeries(
  tenantId: string,
  ruleInput: RecurringRuleInsert,
  template: SeriesEventTemplate,
  opts?: { horizonEnd?: string; maxOccurrences?: number },
): Promise<{ rule: RecurringRule; events: LessonEvent[] }> {
  const rule = await createRule(tenantId, ruleInput);
  const occurrences = generateOccurrences({
    rule,
    horizonEnd: opts?.horizonEnd,
    maxOccurrences: opts?.maxOccurrences,
  });

  const events: LessonEvent[] = [];
  const duration = Math.max(5, template.durationMinutes);
  const timeParts = template.startTimeOfDay.split(":");
  const hh = Number(timeParts[0] ?? 0);
  const mm = Number(timeParts[1] ?? 0);

  for (const iso of occurrences) {
    const date = new Date(iso);
    date.setUTCHours(hh, mm, 0, 0);
    const start = date.toISOString();
    const end = new Date(date.getTime() + duration * 60_000).toISOString();
    const created = await createLessonEvent(tenantId, {
      tenantId,
      title: template.title,
      kind: template.kind,
      status: template.status,
      teacherId: template.teacherId,
      studentId: template.studentId,
      familyId: template.familyId,
      roomId: template.roomId,
      locationId: template.locationId,
      startTime: start,
      endTime: end,
      notes: template.notes ?? null,
      color: template.color ?? null,
      createdBy: template.createdBy ?? null,
      recurrenceId: rule.id,
    });
    events.push(created);
  }

  return { rule, events };
}

/**
 * Apply a patch to every future event in a series.
 */
export async function updateSeries(
  tenantId: string,
  recurrenceId: string,
  patch: {
    fromTime?: string;
    rulePatch?: RecurringRuleUpdate;
    eventPatch?: Partial<
      Pick<
        LessonEvent,
        | "title"
        | "status"
        | "teacherId"
        | "studentId"
        | "roomId"
        | "locationId"
        | "familyId"
        | "notes"
        | "color"
        | "kind"
      >
    >;
  },
): Promise<{ rule: RecurringRule | null; updatedCount: number }> {
  const fromTime = patch.fromTime ?? new Date().toISOString();

  let rule: RecurringRule | null = null;
  if (patch.rulePatch) {
    rule = await updateRule(recurrenceId, tenantId, patch.rulePatch);
  } else {
    rule = await getRecurringRule(recurrenceId, tenantId);
  }

  let updatedCount = 0;
  if (patch.eventPatch) {
    const events = await listLessonEvents(
      tenantId,
      { recurrence_id: recurrenceId, start_from: fromTime },
      { limit: 2000 },
    );
    for (const ev of events) {
      await updateLessonEvent(ev.id, tenantId, patch.eventPatch);
      updatedCount += 1;
    }
  }

  return { rule, updatedCount };
}

/**
 * Cancel (delete) the series — by default only future occurrences.
 */
export async function cancelSeries(
  tenantId: string,
  recurrenceId: string,
  opts?: { fromTime?: string; deleteRule?: boolean },
): Promise<{ removedCount: number; ruleRemoved: boolean }> {
  const fromTime = opts?.fromTime ?? new Date().toISOString();
  const removed = await deleteLessonEventsByRecurrence(tenantId, recurrenceId, {
    fromTime,
  });
  let ruleRemoved = false;
  if (opts?.deleteRule) {
    await deleteRule(recurrenceId, tenantId);
    ruleRemoved = true;
  }
  return { removedCount: removed, ruleRemoved };
}

/**
 * Split a recurring series into two at the given pivot time by:
 *  - clipping the original rule's endDate to the day before the pivot
 *  - creating a new rule based on the original starting from the pivot
 *  - re-pointing future events to the new rule
 */
export async function splitSeries(
  tenantId: string,
  recurrenceId: string,
  pivotTime: string,
  newRuleOverrides?: RecurringRuleUpdate,
): Promise<{
  originalRule: RecurringRule;
  newRule: RecurringRule;
  movedCount: number;
}> {
  const original = await getRecurringRule(recurrenceId, tenantId);
  if (!original) throw new Error(`recurring_rule ${recurrenceId} not found`);

  const pivotDate = new Date(pivotTime);
  const dayBefore = addDays(pivotDate, -1).toISOString().slice(0, 10);
  const pivotDateStr = pivotDate.toISOString().slice(0, 10);

  const updatedOriginal = await updateRule(original.id, tenantId, {
    endDate: dayBefore,
  });

  const { id: _omit, ...rest } = {
    id: undefined,
    tenantId,
    frequency: original.frequency,
    interval: original.interval,
    byWeekday: original.byWeekday ?? null,
    startDate: pivotDateStr,
    endDate: original.endDate ?? null,
    count: null as number | null,
    exceptions: [],
    ...newRuleOverrides,
  } as RecurringRuleInsert & { id?: string };
  void _omit;
  const newRule = await createRule(tenantId, rest);

  const futureEvents = await listLessonEvents(
    tenantId,
    { recurrence_id: original.id, start_from: pivotTime },
    { limit: 2000 },
  );
  let movedCount = 0;
  for (const ev of futureEvents) {
    await updateLessonEvent(ev.id, tenantId, { recurrenceId: newRule.id });
    movedCount += 1;
  }

  return { originalRule: updatedOriginal, newRule, movedCount };
}
