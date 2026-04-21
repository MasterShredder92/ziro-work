var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { createRecurringRule as createRule, deleteRecurringRule as deleteRule, getRecurringRule, updateRecurringRule as updateRule, } from "@data/recurringRules";
import { createLessonEvent, deleteLessonEventsByRecurrence, listLessonEvents, updateLessonEvent, } from "@data/lessonEvents";
function addDays(d, n) {
    const next = new Date(d);
    next.setDate(next.getDate() + n);
    return next;
}
function addMonths(d, n) {
    const next = new Date(d);
    next.setMonth(next.getMonth() + n);
    return next;
}
function parseISODate(s) {
    const d = new Date(s.length <= 10 ? `${s}T00:00:00Z` : s);
    if (Number.isNaN(d.getTime()))
        return new Date();
    return d;
}
/**
 * Enumerate occurrences (as ISO date strings in UTC) for a recurring rule
 * inside a bounded window. Does not create events — see `materializeSeries`.
 */
export function generateOccurrences(opts) {
    var _a, _b;
    const { rule } = opts;
    const maxOccurrences = Math.max(1, Math.min(1000, (_a = opts.maxOccurrences) !== null && _a !== void 0 ? _a : 365));
    const start = parseISODate(rule.startDate);
    const endDate = rule.endDate ? parseISODate(rule.endDate) : null;
    const horizon = opts.horizonEnd ? parseISODate(opts.horizonEnd) : null;
    const limitCount = rule.count && rule.count > 0 ? rule.count : maxOccurrences;
    const exceptions = new Set((_b = rule.exceptions) !== null && _b !== void 0 ? _b : []);
    const out = [];
    const interval = Math.max(1, rule.interval || 1);
    if (rule.frequency === "daily") {
        let cursor = new Date(start);
        while (out.length < limitCount) {
            if (endDate && cursor > endDate)
                break;
            if (horizon && cursor > horizon)
                break;
            const key = cursor.toISOString().slice(0, 10);
            if (!exceptions.has(key))
                out.push(cursor.toISOString());
            cursor = addDays(cursor, interval);
        }
        return out;
    }
    if (rule.frequency === "weekly") {
        const weekdays = (rule.byWeekday && rule.byWeekday.length > 0
            ? rule.byWeekday
            : [start.getUTCDay()]).slice().sort((a, b) => a - b);
        let weekStart = new Date(start);
        weekStart = addDays(weekStart, -weekStart.getUTCDay());
        while (out.length < limitCount) {
            for (const dow of weekdays) {
                const day = addDays(weekStart, dow);
                if (day < start)
                    continue;
                if (endDate && day > endDate)
                    return out;
                if (horizon && day > horizon)
                    return out;
                const key = day.toISOString().slice(0, 10);
                if (!exceptions.has(key))
                    out.push(day.toISOString());
                if (out.length >= limitCount)
                    return out;
            }
            weekStart = addDays(weekStart, 7 * interval);
            if (horizon && weekStart > horizon)
                break;
        }
        return out;
    }
    // monthly
    let cursor = new Date(start);
    while (out.length < limitCount) {
        if (endDate && cursor > endDate)
            break;
        if (horizon && cursor > horizon)
            break;
        const key = cursor.toISOString().slice(0, 10);
        if (!exceptions.has(key))
            out.push(cursor.toISOString());
        cursor = addMonths(cursor, interval);
    }
    return out;
}
/**
 * Create a recurring rule plus its child LessonEvent occurrences within
 * the provided horizon.
 */
export async function materializeSeries(tenantId, ruleInput, template, opts) {
    var _a, _b, _c, _d, _e;
    const rule = await createRule(tenantId, ruleInput);
    const occurrences = generateOccurrences({
        rule,
        horizonEnd: opts === null || opts === void 0 ? void 0 : opts.horizonEnd,
        maxOccurrences: opts === null || opts === void 0 ? void 0 : opts.maxOccurrences,
    });
    const events = [];
    const duration = Math.max(5, template.durationMinutes);
    const timeParts = template.startTimeOfDay.split(":");
    const hh = Number((_a = timeParts[0]) !== null && _a !== void 0 ? _a : 0);
    const mm = Number((_b = timeParts[1]) !== null && _b !== void 0 ? _b : 0);
    for (const iso of occurrences) {
        const date = new Date(iso);
        date.setUTCHours(hh, mm, 0, 0);
        const start = date.toISOString();
        const end = new Date(date.getTime() + duration * 60000).toISOString();
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
            notes: (_c = template.notes) !== null && _c !== void 0 ? _c : null,
            color: (_d = template.color) !== null && _d !== void 0 ? _d : null,
            createdBy: (_e = template.createdBy) !== null && _e !== void 0 ? _e : null,
            recurrenceId: rule.id,
        });
        events.push(created);
    }
    return { rule, events };
}
/**
 * Apply a patch to every future event in a series.
 */
export async function updateSeries(tenantId, recurrenceId, patch) {
    var _a;
    const fromTime = (_a = patch.fromTime) !== null && _a !== void 0 ? _a : new Date().toISOString();
    let rule = null;
    if (patch.rulePatch) {
        rule = await updateRule(recurrenceId, tenantId, patch.rulePatch);
    }
    else {
        rule = await getRecurringRule(recurrenceId, tenantId);
    }
    let updatedCount = 0;
    if (patch.eventPatch) {
        const events = await listLessonEvents(tenantId, { recurrence_id: recurrenceId, start_from: fromTime }, { limit: 2000 });
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
export async function cancelSeries(tenantId, recurrenceId, opts) {
    var _a;
    const fromTime = (_a = opts === null || opts === void 0 ? void 0 : opts.fromTime) !== null && _a !== void 0 ? _a : new Date().toISOString();
    const removed = await deleteLessonEventsByRecurrence(tenantId, recurrenceId, {
        fromTime,
    });
    let ruleRemoved = false;
    if (opts === null || opts === void 0 ? void 0 : opts.deleteRule) {
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
export async function splitSeries(tenantId, recurrenceId, pivotTime, newRuleOverrides) {
    var _a, _b;
    const original = await getRecurringRule(recurrenceId, tenantId);
    if (!original)
        throw new Error(`recurring_rule ${recurrenceId} not found`);
    const pivotDate = new Date(pivotTime);
    const dayBefore = addDays(pivotDate, -1).toISOString().slice(0, 10);
    const pivotDateStr = pivotDate.toISOString().slice(0, 10);
    const updatedOriginal = await updateRule(original.id, tenantId, {
        endDate: dayBefore,
    });
    const _c = Object.assign({ id: undefined, tenantId, frequency: original.frequency, interval: original.interval, byWeekday: (_a = original.byWeekday) !== null && _a !== void 0 ? _a : null, startDate: pivotDateStr, endDate: (_b = original.endDate) !== null && _b !== void 0 ? _b : null, count: null, exceptions: [] }, newRuleOverrides), { id: _omit } = _c, rest = __rest(_c, ["id"]);
    void _omit;
    const newRule = await createRule(tenantId, rest);
    const futureEvents = await listLessonEvents(tenantId, { recurrence_id: original.id, start_from: pivotTime }, { limit: 2000 });
    let movedCount = 0;
    for (const ev of futureEvents) {
        await updateLessonEvent(ev.id, tenantId, { recurrenceId: newRule.id });
        movedCount += 1;
    }
    return { originalRule: updatedOriginal, newRule, movedCount };
}
