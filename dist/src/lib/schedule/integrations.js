/**
 * Integrations between the Scheduling & Calendar OS and the surrounding OSes.
 *
 * These are thin bridges that dispatch into the appropriate module without
 * modifying those modules. All calls are best-effort and must never throw —
 * scheduling is the source of truth and side-effects are advisory.
 */
import { createSessionLog, getSessionLogByBlockId } from "@data/sessionLog";
import { logAudit } from "@/lib/audit/log";
/**
 * Attendance OS: when a LessonEvent is marked complete or no_show, emit a
 * matching `session_log` row so attendance + billing treat it as served.
 */
export async function syncEventToAttendance(tenantId, event) {
    if (!event.studentId || !event.teacherId) {
        return { ok: false, reason: "event missing student or teacher" };
    }
    if (event.status !== "completed" && event.status !== "no_show") {
        return { ok: false, reason: "event not in billable state" };
    }
    try {
        const blockId = event.id;
        const existing = await getSessionLogByBlockId(blockId, tenantId);
        if (existing) {
            return { ok: true, sessionLogId: existing.id };
        }
        const log = await createSessionLog(tenantId, {
            schedule_block_id: blockId,
            block_date: event.startTime.slice(0, 10),
            student_id: event.studentId,
            teacher_id: event.teacherId,
            location_id: event.locationId,
            student_rate: 0,
            teacher_rate: 0,
        });
        await logAudit("schedule.attendance.sync", {
            tenantId,
            eventId: event.id,
            sessionLogId: log.id,
        });
        return { ok: true, sessionLogId: log.id };
    }
    catch (err) {
        return {
            ok: false,
            reason: err instanceof Error ? err.message : "session_log failed",
        };
    }
}
/**
 * Billing OS: trigger billing once the event is completed. The Billing OS
 * reads session_log directly, so this simply records an audit line.
 */
export async function triggerBillingForEvent(tenantId, event) {
    if (event.status !== "completed") {
        return { ok: false, reason: "event not completed" };
    }
    try {
        await logAudit("schedule.billing.trigger", {
            tenantId,
            eventId: event.id,
            studentId: event.studentId,
            teacherId: event.teacherId,
        });
        return { ok: true };
    }
    catch (err) {
        return {
            ok: false,
            reason: err instanceof Error ? err.message : "trigger failed",
        };
    }
}
/**
 * Messaging OS: schedule a reminder about an upcoming lesson. Because the
 * messaging module currently only supports immediate conversations, this
 * records an audit row describing the intent; a future worker can pick it
 * up and deliver.
 */
export async function scheduleEventReminder(tenantId, event, offsetMinutes = 24 * 60) {
    try {
        const remindAt = new Date(new Date(event.startTime).getTime() - offsetMinutes * 60000);
        await logAudit("schedule.messaging.reminder_scheduled", {
            tenantId,
            eventId: event.id,
            scheduledFor: remindAt.toISOString(),
            studentId: event.studentId,
            familyId: event.familyId,
            teacherId: event.teacherId,
        });
        return { ok: true, scheduledFor: remindAt.toISOString() };
    }
    catch (_a) {
        return { ok: false };
    }
}
/**
 * Messaging OS: record a scheduling-change notification intent.
 */
export async function notifyScheduleChange(tenantId, event, change) {
    try {
        await logAudit(`schedule.notify.${change}`, {
            tenantId,
            eventId: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            studentId: event.studentId,
            familyId: event.familyId,
            teacherId: event.teacherId,
        });
        return { ok: true };
    }
    catch (_a) {
        return { ok: false };
    }
}
