"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveScheduleContext } from "../guard";
import { cancelEvent, createEventWithSideEffects, updateEventWithSideEffects, } from "@/lib/schedule/service";
import { materializeSeries, } from "@/lib/schedule/recurrence";
import { logAudit } from "@/lib/audit/log";
function str(form, key) {
    const v = form.get(key);
    return typeof v === "string" ? v.trim() : "";
}
function strOrNull(form, key) {
    const v = str(form, key);
    return v ? v : null;
}
function num(form, key, fallback) {
    const v = form.get(key);
    const n = typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : fallback;
}
function bool(form, key) {
    const v = form.get(key);
    return v === "on" || v === "true" || v === "1";
}
function combine(date, time) {
    if (!date || !time)
        return new Date().toISOString();
    const iso = new Date(`${date}T${time}`).toISOString();
    return iso;
}
export async function createEventAction(form) {
    const ctx = await resolveScheduleContext({ requireWrite: true });
    const title = str(form, "title") || "Untitled event";
    const kind = (str(form, "kind") || "lesson");
    const status = (str(form, "status") || "scheduled");
    const date = str(form, "date");
    const startHH = str(form, "startTime") || "09:00";
    const durationMin = Math.max(5, num(form, "durationMinutes", 45));
    const startIso = combine(date, startHH);
    const endIso = new Date(new Date(startIso).getTime() + durationMin * 60000).toISOString();
    const repeat = bool(form, "repeat");
    const frequency = (str(form, "frequency") || "weekly");
    const interval = Math.max(1, num(form, "interval", 1));
    const endDate = strOrNull(form, "endDate");
    const count = num(form, "count", 0);
    if (repeat) {
        const { rule } = await materializeSeries(ctx.tenantId, {
            tenantId: ctx.tenantId,
            frequency,
            interval,
            byWeekday: null,
            startDate: date || new Date().toISOString().slice(0, 10),
            endDate: endDate !== null && endDate !== void 0 ? endDate : null,
            count: count > 0 ? count : null,
            exceptions: [],
        }, {
            tenantId: ctx.tenantId,
            title,
            kind,
            status,
            teacherId: strOrNull(form, "teacherId"),
            studentId: strOrNull(form, "studentId"),
            familyId: strOrNull(form, "familyId"),
            roomId: strOrNull(form, "roomId"),
            locationId: strOrNull(form, "locationId"),
            notes: strOrNull(form, "notes"),
            color: strOrNull(form, "color"),
            createdBy: ctx.session.userId,
            durationMinutes: durationMin,
            startTimeOfDay: startHH,
        }, { maxOccurrences: count > 0 ? count : 52 });
        await logAudit("schedule.events.series_created", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            ruleId: rule.id,
        });
    }
    else {
        await createEventWithSideEffects(ctx.tenantId, {
            title,
            kind,
            status,
            teacherId: strOrNull(form, "teacherId"),
            studentId: strOrNull(form, "studentId"),
            familyId: strOrNull(form, "familyId"),
            roomId: strOrNull(form, "roomId"),
            locationId: strOrNull(form, "locationId"),
            startTime: startIso,
            endTime: endIso,
            notes: strOrNull(form, "notes"),
            color: strOrNull(form, "color"),
            createdBy: ctx.session.userId,
            recurrenceId: null,
        }, { allowConflict: bool(form, "allowConflict") });
    }
    revalidatePath("/schedule");
    redirect("/schedule");
}
export async function updateEventAction(eventId, form) {
    const ctx = await resolveScheduleContext({ requireWrite: true });
    const title = str(form, "title");
    const status = str(form, "status");
    const date = str(form, "date");
    const startHH = str(form, "startTime");
    const durationMin = num(form, "durationMinutes", 0);
    const patch = {};
    if (title)
        patch.title = title;
    if (status)
        patch.status = status;
    if (date && startHH) {
        const startIso = combine(date, startHH);
        patch.startTime = startIso;
        if (durationMin > 0) {
            patch.endTime = new Date(new Date(startIso).getTime() + durationMin * 60000).toISOString();
        }
    }
    const teacherId = str(form, "teacherId");
    if (teacherId)
        patch.teacherId = teacherId;
    const studentId = str(form, "studentId");
    if (studentId)
        patch.studentId = studentId;
    const roomId = str(form, "roomId");
    if (roomId)
        patch.roomId = roomId;
    const notes = form.get("notes");
    if (typeof notes === "string")
        patch.notes = notes;
    await updateEventWithSideEffects(ctx.tenantId, eventId, patch, {
        allowConflict: bool(form, "allowConflict"),
    });
    revalidatePath("/schedule");
    redirect(`/schedule/events/${eventId}`);
}
export async function cancelEventAction(eventId) {
    const ctx = await resolveScheduleContext({ requireWrite: true });
    await cancelEvent(ctx.tenantId, eventId);
    revalidatePath("/schedule");
    redirect("/schedule");
}
export async function deleteEventAction(eventId) {
    const ctx = await resolveScheduleContext({ requireWrite: true });
    await cancelEvent(ctx.tenantId, eventId, { hardDelete: true });
    revalidatePath("/schedule");
    redirect("/schedule");
}
