import "server-only";
import { sendMessage as sendMessageService } from "@/lib/messaging/service";
import { sendMessage as sendMessageOps } from "@/lib/messaging/messageOps";
import { renderTemplateForContext } from "@/lib/templates/service";
import { logAudit } from "@/lib/audit/log";
import { updateAppointment } from "@/lib/scheduling/schedulingOps";
import { createTask as createTaskRow } from "@data/tasks";
import { updateContact } from "@data/contacts";
import { updateStudent } from "@data/students";
import { updateFamily } from "@data/families";
import { createInvoice as createInvoiceRow } from "@data/invoices";
import { createCredit } from "@data/credits";
import { createEvent, updateEvent } from "@/lib/schedule/queries";
import { generateInvoice as generateBillingInvoice, updateSubscription as updateBillingSubscription, } from "@/lib/billing/billingOps";
function resolveTemplate(value, payload) {
    if (typeof value !== "string")
        return value;
    return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
        const parts = path.split(".");
        let cursor = payload;
        for (const part of parts) {
            if (cursor === null || cursor === undefined)
                return "";
            if (typeof cursor !== "object")
                return "";
            cursor = cursor[part];
        }
        if (cursor === null || cursor === undefined)
            return "";
        return String(cursor);
    });
}
function resolveConfig(config, payload) {
    const out = {};
    if (!config)
        return out;
    for (const [k, v] of Object.entries(config)) {
        out[k] = resolveTemplate(v, payload);
    }
    return out;
}
function valueAtPath(obj, path) {
    if (!path)
        return undefined;
    const parts = path.split(".");
    let cursor = obj;
    for (const part of parts) {
        if (cursor === null || cursor === undefined)
            return undefined;
        if (typeof cursor !== "object")
            return undefined;
        cursor = cursor[part];
    }
    return cursor;
}
export async function runAction(action, ctx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22;
    const config = resolveConfig(action.config, ctx.payload);
    const type = action.type;
    try {
        switch (type) {
            case "sendMessage": {
                const tenantId = ctx.tenantId;
                const senderId = String((_b = (_a = config.senderId) !== null && _a !== void 0 ? _a : ctx.triggeredBy) !== null && _b !== void 0 ? _b : "system");
                const recipientId = String((_d = (_c = config.recipientId) !== null && _c !== void 0 ? _c : config.profileId) !== null && _d !== void 0 ? _d : "");
                const body = String((_e = config.body) !== null && _e !== void 0 ? _e : "");
                if (!recipientId)
                    throw new Error("recipientId is required for sendMessage");
                const sent = await sendMessageOps(tenantId, senderId, {
                    recipientIds: [recipientId],
                    body,
                    channelType: "in_app",
                });
                return { ok: true, output: { threadId: sent.thread.id, messageId: sent.message.id } };
            }
            case "createTask": {
                const title = String((_f = config.title) !== null && _f !== void 0 ? _f : "Task");
                const task = await createTaskRow(ctx.tenantId, {
                    title,
                    description: typeof config.description === "string" ? config.description : null,
                    status: "todo",
                    task_type: typeof config.taskType === "string"
                        ? config.taskType
                        : "automation",
                    priority: typeof config.priority === "string" ? config.priority : "medium",
                    assigned_to: typeof config.assignedTo === "string" ? config.assignedTo : null,
                    assigned_role: typeof config.assignedRole === "string" ? config.assignedRole : null,
                    due_date: typeof config.dueDate === "string" ? config.dueDate : null,
                    entity_type: typeof config.entityType === "string" ? config.entityType : "automation_run",
                    entity_id: typeof config.entityId === "string" ? config.entityId : ctx.runId,
                });
                return { ok: true, output: { taskId: task.id, title: task.title } };
            }
            case "updateAppointment": {
                const tenantId = ctx.tenantId;
                const appointmentId = String((_g = config.appointmentId) !== null && _g !== void 0 ? _g : "");
                if (!appointmentId)
                    throw new Error("appointmentId is required for updateAppointment");
                const updated = await updateAppointment(tenantId, appointmentId, {
                    title: typeof config.title === "string" ? config.title : undefined,
                    startsAt: typeof config.startsAt === "string" ? config.startsAt : undefined,
                    endsAt: typeof config.endsAt === "string" ? config.endsAt : undefined,
                    status: config.status === "scheduled" ||
                        config.status === "canceled" ||
                        config.status === "completed"
                        ? config.status
                        : undefined,
                    notes: typeof config.notes === "string" || config.notes === null
                        ? config.notes
                        : undefined,
                });
                return { ok: true, output: { appointmentId: updated.id } };
            }
            case "callWebhook": {
                const url = String((_h = config.url) !== null && _h !== void 0 ? _h : "");
                if (!url)
                    throw new Error("url is required for callWebhook");
                const method = String((_j = config.method) !== null && _j !== void 0 ? _j : "POST").toUpperCase();
                const res = await fetch(url, {
                    method,
                    headers: Object.assign({ "content-type": "application/json" }, ((_k = config.headers) !== null && _k !== void 0 ? _k : {})),
                    body: method === "GET" || method === "HEAD"
                        ? undefined
                        : JSON.stringify(Object.assign({ tenantId: ctx.tenantId, workflowId: ctx.workflowId, runId: ctx.runId, payload: ctx.payload }, (typeof config.body === "object" && config.body
                            ? config.body
                            : {}))),
                });
                const text = await res.text().catch(() => "");
                return {
                    ok: res.ok,
                    output: { status: res.status, body: text.slice(0, 10000) },
                    error: res.ok ? undefined : { message: `HTTP ${res.status}`, code: String(res.status) },
                };
            }
            case "messaging.send": {
                const profileId = String((_m = (_l = config.profileId) !== null && _l !== void 0 ? _l : ctx.payload.profileId) !== null && _m !== void 0 ? _m : "");
                const body = String((_o = config.body) !== null && _o !== void 0 ? _o : "");
                if (!profileId)
                    throw new Error("profileId is required for messaging.send");
                const senderId = String((_q = (_p = config.senderId) !== null && _p !== void 0 ? _p : ctx.triggeredBy) !== null && _q !== void 0 ? _q : "system");
                const detail = await sendMessageService(senderId, profileId, body);
                return {
                    ok: true,
                    output: { threadId: detail.thread.id, channel: (_r = config.channel) !== null && _r !== void 0 ? _r : "in_app" },
                };
            }
            case "crm.updateContact":
            case "crm.updateStudent":
            case "crm.updateFamily": {
                if (type === "crm.updateContact") {
                    const contactId = String((_s = config.contactId) !== null && _s !== void 0 ? _s : "");
                    if (!contactId)
                        throw new Error("contactId is required for crm.updateContact");
                    const updated = await updateContact(ctx.tenantId, contactId, {
                        firstName: typeof config.firstName === "string" ? config.firstName : undefined,
                        lastName: typeof config.lastName === "string" ? config.lastName : undefined,
                        email: typeof config.email === "string" ? config.email : undefined,
                        phone: typeof config.phone === "string" ? config.phone : undefined,
                        status: typeof config.status === "string" ? config.status : undefined,
                        tags: Array.isArray(config.tags)
                            ? (config.tags.filter((v) => typeof v === "string"))
                            : undefined,
                        notes: typeof config.notes === "string" ? config.notes : undefined,
                    });
                    return { ok: true, output: { contactId, updated } };
                }
                if (type === "crm.updateStudent") {
                    const studentId = String((_t = config.studentId) !== null && _t !== void 0 ? _t : "");
                    if (!studentId)
                        throw new Error("studentId is required for crm.updateStudent");
                    const updated = await updateStudent(studentId, ctx.tenantId, {
                        first_name: typeof config.firstName === "string" ? config.firstName : undefined,
                        last_name: typeof config.lastName === "string" ? config.lastName : undefined,
                        email: typeof config.email === "string" ? config.email : undefined,
                        phone: typeof config.phone === "string" ? config.phone : undefined,
                        status: typeof config.status === "string" ? config.status : undefined,
                        notes: typeof config.notes === "string" ? config.notes : undefined,
                    });
                    return { ok: true, output: { studentId, updated } };
                }
                const familyId = String((_u = config.familyId) !== null && _u !== void 0 ? _u : "");
                if (!familyId)
                    throw new Error("familyId is required for crm.updateFamily");
                const updated = await updateFamily(familyId, ctx.tenantId, {
                    name: typeof config.name === "string" ? config.name : undefined,
                    primary_email: typeof config.email === "string" ? config.email : undefined,
                    primary_phone: typeof config.phone === "string" ? config.phone : undefined,
                    billing_status: typeof config.billingStatus === "string"
                        ? config.billingStatus
                        : undefined,
                });
                return { ok: true, output: { familyId, updated } };
            }
            case "billing.createInvoice":
            case "billing.applyCredit": {
                if (type === "billing.createInvoice") {
                    const amountCents = Number((_w = (_v = config.amountCents) !== null && _v !== void 0 ? _v : config.totalCents) !== null && _w !== void 0 ? _w : 0);
                    const invoice = await createInvoiceRow(ctx.tenantId, {
                        family_id: typeof config.familyId === "string" ? config.familyId : null,
                        student_id: typeof config.studentId === "string" ? config.studentId : null,
                        subscription_id: typeof config.subscriptionId === "string"
                            ? config.subscriptionId
                            : null,
                        status: typeof config.status === "string" ? config.status : "draft",
                        currency: typeof config.currency === "string" ? config.currency : "USD",
                        amount_cents: Number.isFinite(amountCents) ? Math.max(0, amountCents) : 0,
                        subtotal_cents: typeof config.subtotalCents === "number"
                            ? config.subtotalCents
                            : undefined,
                        tax_cents: typeof config.taxCents === "number" ? config.taxCents : undefined,
                        discount_cents: typeof config.discountCents === "number"
                            ? config.discountCents
                            : undefined,
                        due_at: typeof config.dueAt === "string" ? config.dueAt : null,
                        notes: typeof config.notes === "string" ? config.notes : null,
                        metadata: Object.assign({ automationRunId: ctx.runId }, config.metadata),
                    });
                    return { ok: true, output: { invoiceId: invoice.id, status: invoice.status } };
                }
                const amountCents = Number((_x = config.amountCents) !== null && _x !== void 0 ? _x : 0);
                if (!Number.isFinite(amountCents) || amountCents <= 0) {
                    throw new Error("amountCents must be a positive number for billing.applyCredit");
                }
                const credit = await createCredit(ctx.tenantId, {
                    amount_cents: Math.round(amountCents),
                    family_id: typeof config.familyId === "string" ? config.familyId : null,
                    student_id: typeof config.studentId === "string" ? config.studentId : null,
                    invoice_id: typeof config.invoiceId === "string" ? config.invoiceId : null,
                    reason: typeof config.reason === "string" ? config.reason : "automation",
                    metadata: Object.assign({ automationRunId: ctx.runId }, config.metadata),
                });
                return { ok: true, output: { creditId: credit.id, amountCents: credit.amount_cents } };
            }
            case "billing.notifyCustomer": {
                const recipientId = String((_z = (_y = config.recipientId) !== null && _y !== void 0 ? _y : config.profileId) !== null && _z !== void 0 ? _z : "");
                if (!recipientId)
                    throw new Error("recipientId is required for billing.notifyCustomer");
                const senderId = String((_1 = (_0 = config.senderId) !== null && _0 !== void 0 ? _0 : ctx.triggeredBy) !== null && _1 !== void 0 ? _1 : "system");
                const messageBody = String((_2 = config.body) !== null && _2 !== void 0 ? _2 : `Billing update for invoice ${String((_3 = config.invoiceId) !== null && _3 !== void 0 ? _3 : "").trim() || "account"}.`);
                const sent = await sendMessageOps(ctx.tenantId, senderId, {
                    recipientIds: [recipientId],
                    body: messageBody,
                    channelType: "in_app",
                });
                return { ok: true, output: { threadId: sent.thread.id, messageId: sent.message.id } };
            }
            case "billing.updateSubscription": {
                const subscriptionId = String((_4 = config.subscriptionId) !== null && _4 !== void 0 ? _4 : "");
                if (!subscriptionId)
                    throw new Error("subscriptionId is required for billing.updateSubscription");
                const updated = await updateBillingSubscription({
                    tenantId: ctx.tenantId,
                    subscriptionId,
                    status: typeof config.status === "string" ? config.status : undefined,
                    planId: typeof config.planId === "string" || config.planId === null
                        ? config.planId
                        : undefined,
                });
                return { ok: true, output: { subscriptionId: updated.id, status: updated.status } };
            }
            case "billing.generateInvoice": {
                const periodStart = String((_5 = config.periodStart) !== null && _5 !== void 0 ? _5 : "");
                const periodEnd = String((_6 = config.periodEnd) !== null && _6 !== void 0 ? _6 : "");
                if (!periodStart || !periodEnd) {
                    throw new Error("periodStart and periodEnd are required for billing.generateInvoice");
                }
                const invoice = await generateBillingInvoice({
                    tenantId: ctx.tenantId,
                    period: { start: periodStart, end: periodEnd },
                    subscriptionId: typeof config.subscriptionId === "string"
                        ? config.subscriptionId
                        : undefined,
                    familyId: typeof config.familyId === "string" ? config.familyId : undefined,
                    studentId: typeof config.studentId === "string" ? config.studentId : undefined,
                });
                return { ok: true, output: { invoiceId: invoice.id, status: invoice.status } };
            }
            case "schedule.createEvent":
            case "schedule.updateEvent": {
                if (type === "schedule.createEvent") {
                    const statusValue = config.status === "scheduled" ||
                        config.status === "confirmed" ||
                        config.status === "cancelled" ||
                        config.status === "completed" ||
                        config.status === "no_show" ||
                        config.status === "rescheduled"
                        ? config.status
                        : "scheduled";
                    const kindValue = config.kind === "lesson" ||
                        config.kind === "group" ||
                        config.kind === "makeup" ||
                        config.kind === "evaluation" ||
                        config.kind === "hold" ||
                        config.kind === "event" ||
                        config.kind === "other"
                        ? config.kind
                        : "lesson";
                    const event = await createEvent(ctx.tenantId, {
                        title: String((_7 = config.title) !== null && _7 !== void 0 ? _7 : "Lesson"),
                        startTime: String((_8 = config.startTime) !== null && _8 !== void 0 ? _8 : ""),
                        endTime: String((_9 = config.endTime) !== null && _9 !== void 0 ? _9 : ""),
                        teacherId: typeof config.teacherId === "string" ? config.teacherId : null,
                        studentId: typeof config.studentId === "string" ? config.studentId : null,
                        familyId: typeof config.familyId === "string" ? config.familyId : null,
                        roomId: typeof config.roomId === "string" ? config.roomId : null,
                        locationId: typeof config.locationId === "string" ? config.locationId : null,
                        status: statusValue,
                        notes: typeof config.notes === "string" ? config.notes : null,
                        kind: kindValue,
                    }, { allowConflict: config.allowConflict === true });
                    return { ok: true, output: { eventId: event.id } };
                }
                const eventId = String((_10 = config.eventId) !== null && _10 !== void 0 ? _10 : "");
                if (!eventId)
                    throw new Error("eventId is required for schedule.updateEvent");
                const nextStatus = config.status === "scheduled" ||
                    config.status === "confirmed" ||
                    config.status === "cancelled" ||
                    config.status === "completed" ||
                    config.status === "no_show" ||
                    config.status === "rescheduled"
                    ? config.status
                    : undefined;
                const nextKind = config.kind === "lesson" ||
                    config.kind === "group" ||
                    config.kind === "makeup" ||
                    config.kind === "evaluation" ||
                    config.kind === "hold" ||
                    config.kind === "event" ||
                    config.kind === "other"
                    ? config.kind
                    : undefined;
                const updated = await updateEvent(ctx.tenantId, eventId, {
                    title: typeof config.title === "string" ? config.title : undefined,
                    startTime: typeof config.startTime === "string" ? config.startTime : undefined,
                    endTime: typeof config.endTime === "string" ? config.endTime : undefined,
                    teacherId: typeof config.teacherId === "string" ? config.teacherId : undefined,
                    studentId: typeof config.studentId === "string" ? config.studentId : undefined,
                    familyId: typeof config.familyId === "string" ? config.familyId : undefined,
                    roomId: typeof config.roomId === "string" ? config.roomId : undefined,
                    locationId: typeof config.locationId === "string" ? config.locationId : undefined,
                    status: nextStatus,
                    notes: typeof config.notes === "string" || config.notes === null
                        ? config.notes
                        : undefined,
                    kind: nextKind,
                }, { allowConflict: config.allowConflict === true });
                return { ok: true, output: { eventId: updated.id, status: updated.status } };
            }
            case "content.renderTemplate": {
                const templateId = String((_11 = config.templateId) !== null && _11 !== void 0 ? _11 : "");
                if (!templateId)
                    throw new Error("templateId required");
                const versionId = config.versionId !== undefined ? String(config.versionId) : undefined;
                const contextInput = ((_12 = config.context) !== null && _12 !== void 0 ? _12 : ctx.payload);
                const mergeContext = Object.assign(Object.assign({}, contextInput), { tenant: Object.assign({ id: ctx.tenantId }, ((_13 = contextInput.tenant) !== null && _13 !== void 0 ? _13 : {})) });
                const rendered = await renderTemplateForContext({
                    templateId,
                    versionId,
                    context: mergeContext,
                    tenantId: ctx.tenantId,
                });
                return {
                    ok: true,
                    output: {
                        templateId: rendered.templateId,
                        version: rendered.version,
                        subject: rendered.subject,
                        body: rendered.body,
                        missingMergeFields: rendered.missingMergeFields,
                    },
                };
            }
            case "progress.addEvidence": {
                await logAudit(`automation.action.${type}`, {
                    tenantId: ctx.tenantId,
                    runId: ctx.runId,
                    workflowId: ctx.workflowId,
                    actionId: action.id,
                    config,
                });
                return { ok: true, output: { notice: "evidence queued", config } };
            }
            case "assessments.createAttempt":
            case "assessments.gradeAttempt": {
                await logAudit(`automation.action.${type}`, {
                    tenantId: ctx.tenantId,
                    runId: ctx.runId,
                    workflowId: ctx.workflowId,
                    actionId: action.id,
                    config,
                });
                return { ok: true, output: { notice: `${type} queued`, config } };
            }
            case "http.request": {
                const url = String((_14 = config.url) !== null && _14 !== void 0 ? _14 : "");
                if (!url)
                    throw new Error("url is required for http.request");
                const method = String((_15 = config.method) !== null && _15 !== void 0 ? _15 : "POST").toUpperCase();
                const headers = (_16 = config.headers) !== null && _16 !== void 0 ? _16 : {};
                const body = config.body !== undefined
                    ? typeof config.body === "string"
                        ? String(config.body)
                        : JSON.stringify(config.body)
                    : undefined;
                const init = {
                    method,
                    headers: Object.assign({ "content-type": "application/json" }, headers),
                    body: method === "GET" || method === "HEAD" ? undefined : body,
                };
                const res = await fetch(url, init);
                const text = await res.text().catch(() => "");
                return {
                    ok: res.ok,
                    output: { status: res.status, body: text.slice(0, 10000) },
                    error: res.ok
                        ? undefined
                        : { message: `HTTP ${res.status}`, code: String(res.status) },
                };
            }
            case "automation.delay": {
                const seconds = Number((_17 = config.seconds) !== null && _17 !== void 0 ? _17 : 0);
                const delayMs = Math.max(0, Math.floor(seconds * 1000));
                return { ok: true, output: { delayMs }, delayMs };
            }
            case "automation.branch": {
                const path = String((_18 = config.path) !== null && _18 !== void 0 ? _18 : "");
                const actual = valueAtPath(ctx.payload, path);
                const equals = config.equals;
                const match = equals === undefined ? Boolean(actual) : actual === equals;
                const branchTo = match
                    ? ((_20 = (_19 = action.branches) === null || _19 === void 0 ? void 0 : _19.true) !== null && _20 !== void 0 ? _20 : null)
                    : ((_22 = (_21 = action.branches) === null || _21 === void 0 ? void 0 : _21.false) !== null && _22 !== void 0 ? _22 : null);
                return { ok: true, output: { path, matched: match, branchTo }, branchTo };
            }
            default: {
                return {
                    ok: false,
                    error: {
                        message: `Unknown action type: ${type}`,
                        code: "UNKNOWN_ACTION",
                    },
                };
            }
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = err && typeof err === "object" && "code" in err
            ? String(err.code)
            : undefined;
        return { ok: false, error: { message, code } };
    }
}
