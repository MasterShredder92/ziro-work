import "server-only";
import { getTemplate } from "@data/templates";
function substitute(input, vars) {
    return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
        const parts = String(key).split(".");
        let value = vars;
        for (const p of parts) {
            if (value && typeof value === "object" && p in value) {
                value = value[p];
            }
            else {
                value = undefined;
                break;
            }
        }
        return value === null || value === undefined ? "" : String(value);
    });
}
export async function renderTemplate(tenantId, templateId, vars) {
    try {
        const tpl = await getTemplate(templateId, tenantId);
        if (!tpl)
            return null;
        const template = tpl;
        const subject = typeof template.subject === "string"
            ? substitute(template.subject, vars)
            : null;
        const body = typeof template.body === "string" ? substitute(template.body, vars) : "";
        const bodyHtml = typeof template.body_html === "string"
            ? substitute(template.body_html, vars)
            : null;
        return { subject, body, bodyHtml, templateId };
    }
    catch (_a) {
        return null;
    }
}
export async function resolveContact(tenantId, contactId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    if (!contactId) {
        return {
            profileId: null,
            email: null,
            phone: null,
            displayName: "Unknown",
            source: "unknown",
        };
    }
    try {
        const { getProfileById } = await import("@data/profiles");
        const profile = await getProfileById(contactId, tenantId);
        if (profile) {
            const display = `${(_a = profile.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = profile.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() ||
                profile.email ||
                profile.id;
            return {
                profileId: profile.id,
                email: (_c = profile.email) !== null && _c !== void 0 ? _c : null,
                phone: (_d = profile.phone) !== null && _d !== void 0 ? _d : null,
                displayName: display,
                source: "profile",
            };
        }
    }
    catch (_o) {
        /* noop - profile table may be missing */
    }
    try {
        const { getStudentById } = await import("@data/students");
        const student = await getStudentById(contactId, tenantId);
        if (student) {
            const s = student;
            const display = `${(_e = s.first_name) !== null && _e !== void 0 ? _e : ""} ${(_f = s.last_name) !== null && _f !== void 0 ? _f : ""}`.trim() ||
                s.email ||
                contactId;
            return {
                profileId: null,
                email: (_g = s.email) !== null && _g !== void 0 ? _g : null,
                phone: (_h = s.phone) !== null && _h !== void 0 ? _h : null,
                displayName: display,
                source: "student",
            };
        }
    }
    catch (_p) {
        /* noop */
    }
    try {
        const { getLeadById } = await import("@data/leads");
        const lead = await getLeadById(contactId, tenantId);
        if (lead) {
            const l = lead;
            const display = `${(_j = l.first_name) !== null && _j !== void 0 ? _j : ""} ${(_k = l.last_name) !== null && _k !== void 0 ? _k : ""}`.trim() ||
                l.email ||
                contactId;
            return {
                profileId: null,
                email: (_l = l.email) !== null && _l !== void 0 ? _l : null,
                phone: (_m = l.phone) !== null && _m !== void 0 ? _m : null,
                displayName: display,
                source: "lead",
            };
        }
    }
    catch (_q) {
        /* noop */
    }
    return {
        profileId: null,
        email: null,
        phone: null,
        displayName: contactId,
        source: "unknown",
    };
}
/**
 * Scheduling OS hook — queue a reminder triggered by a message. The Scheduling
 * OS polls its own queue; we write a hint into the session log so it can be
 * picked up by the scheduler's worker.
 */
export async function scheduleReminder(input) {
    try {
        const { logAuditWithContext } = await import("@/lib/audit/log");
        await logAuditWithContext("messaging.reminder_scheduled", { tenantId: input.tenantId }, {
            message_id: input.messageId,
            thread_id: input.threadId,
            run_at: input.runAt,
            note: input.note,
        });
    }
    catch (_a) {
        /* noop */
    }
}
/**
 * Automation OS trigger — emit an automation event so rules like
 * "on new message" or "on unread for X hours" can fire. Uses a dynamic import
 * so tests and bootstrap code don't hard-depend on Automation OS.
 */
export async function emitAutomationTrigger(tenantId, event, payload) {
    try {
        const { dispatchAutomationEvent } = await import("@/lib/automation/engine");
        await dispatchAutomationEvent(event, {
            tenantId,
            data: payload,
        });
        return;
    }
    catch (_a) {
        /* noop */
    }
    try {
        const { logAuditWithContext } = await import("@/lib/audit/log");
        await logAuditWithContext(`automation.trigger.${event}`, { tenantId }, payload);
    }
    catch (_b) {
        /* noop */
    }
}
