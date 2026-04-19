import "server-only";
import { sendMessage as sendMessageService } from "@/lib/messaging/service";
import { sendMessage as sendMessageOps } from "@/lib/messaging/messageOps";
import { renderTemplateForContext } from "@/lib/templates/service";
import type { TemplateContext } from "@/lib/templates/types";
import { logAudit } from "@/lib/audit/log";
import { updateAppointment } from "@/lib/scheduling/schedulingOps";
import { createTask as createTaskRow } from "@data/tasks";
import { updateContact } from "@data/contacts";
import { updateStudent } from "@data/students";
import { updateFamily } from "@data/families";
import { createInvoice as createInvoiceRow } from "@data/invoices";
import { createCredit } from "@data/credits";
import { createEvent, updateEvent } from "@/lib/schedule/queries";
import {
  generateInvoice as generateBillingInvoice,
  updateSubscription as updateBillingSubscription,
} from "@/lib/billing/billingOps";
import type {
  AutomationActionDef,
  AutomationActionResult,
  AutomationActionType,
  AutomationRunContext,
} from "./types";

function resolveTemplate(
  value: unknown,
  payload: Record<string, unknown>,
): unknown {
  if (typeof value !== "string") return value;
  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const parts = path.split(".");
    let cursor: unknown = payload;
    for (const part of parts) {
      if (cursor === null || cursor === undefined) return "";
      if (typeof cursor !== "object") return "";
      cursor = (cursor as Record<string, unknown>)[part];
    }
    if (cursor === null || cursor === undefined) return "";
    return String(cursor);
  });
}

function resolveConfig(
  config: Record<string, unknown> | undefined,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!config) return out;
  for (const [k, v] of Object.entries(config)) {
    out[k] = resolveTemplate(v, payload);
  }
  return out;
}

function valueAtPath(obj: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const part of parts) {
    if (cursor === null || cursor === undefined) return undefined;
    if (typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

export async function runAction(
  action: AutomationActionDef,
  ctx: AutomationRunContext,
): Promise<AutomationActionResult> {
  const config = resolveConfig(action.config, ctx.payload);
  const type = action.type as AutomationActionType | string;

  try {
    switch (type) {
      case "sendMessage": {
        const tenantId = ctx.tenantId;
        const senderId = String(config.senderId ?? ctx.triggeredBy ?? "system");
        const recipientId = String(config.recipientId ?? config.profileId ?? "");
        const body = String(config.body ?? "");
        if (!recipientId) throw new Error("recipientId is required for sendMessage");
        const sent = await sendMessageOps(tenantId, senderId, {
          recipientIds: [recipientId],
          body,
          channelType: "in_app",
        });
        return { ok: true, output: { threadId: sent.thread.id, messageId: sent.message.id } };
      }
      case "createTask": {
        const title = String(config.title ?? "Task");
        const task = await createTaskRow(ctx.tenantId, {
          title,
          description:
            typeof config.description === "string" ? config.description : null,
          status: "todo",
          task_type:
            typeof config.taskType === "string"
              ? config.taskType
              : "automation",
          priority:
            typeof config.priority === "string" ? config.priority : "medium",
          assigned_to:
            typeof config.assignedTo === "string" ? config.assignedTo : null,
          assigned_role:
            typeof config.assignedRole === "string" ? config.assignedRole : null,
          due_date: typeof config.dueDate === "string" ? config.dueDate : null,
          entity_type:
            typeof config.entityType === "string" ? config.entityType : "automation_run",
          entity_id:
            typeof config.entityId === "string" ? config.entityId : ctx.runId,
        });
        return { ok: true, output: { taskId: task.id, title: task.title } };
      }
      case "updateAppointment": {
        const tenantId = ctx.tenantId;
        const appointmentId = String(config.appointmentId ?? "");
        if (!appointmentId) throw new Error("appointmentId is required for updateAppointment");
        const updated = await updateAppointment(tenantId, appointmentId, {
          title:
            typeof config.title === "string" ? config.title : undefined,
          startsAt:
            typeof config.startsAt === "string" ? config.startsAt : undefined,
          endsAt:
            typeof config.endsAt === "string" ? config.endsAt : undefined,
          status:
            config.status === "scheduled" ||
            config.status === "canceled" ||
            config.status === "completed"
              ? config.status
              : undefined,
          notes:
            typeof config.notes === "string" || config.notes === null
              ? (config.notes as string | null)
              : undefined,
        });
        return { ok: true, output: { appointmentId: updated.id } };
      }
      case "callWebhook": {
        const url = String(config.url ?? "");
        if (!url) throw new Error("url is required for callWebhook");
        const method = String(config.method ?? "POST").toUpperCase();
        const res = await fetch(url, {
          method,
          headers: {
            "content-type": "application/json",
            ...((config.headers as Record<string, string> | undefined) ?? {}),
          },
          body:
            method === "GET" || method === "HEAD"
              ? undefined
              : JSON.stringify({
                  tenantId: ctx.tenantId,
                  workflowId: ctx.workflowId,
                  runId: ctx.runId,
                  payload: ctx.payload,
                  ...(typeof config.body === "object" && config.body
                    ? (config.body as Record<string, unknown>)
                    : {}),
                }),
        });
        const text = await res.text().catch(() => "");
        return {
          ok: res.ok,
          output: { status: res.status, body: text.slice(0, 10000) },
          error: res.ok ? undefined : { message: `HTTP ${res.status}`, code: String(res.status) },
        };
      }
      case "messaging.send": {
        const profileId = String(config.profileId ?? ctx.payload.profileId ?? "");
        const body = String(config.body ?? "");
        if (!profileId) throw new Error("profileId is required for messaging.send");
        const senderId = String(config.senderId ?? ctx.triggeredBy ?? "system");
        const detail = await sendMessageService(senderId, profileId, body);
        return {
          ok: true,
          output: { threadId: detail.thread.id, channel: config.channel ?? "in_app" },
        };
      }
      case "crm.updateContact":
      case "crm.updateStudent":
      case "crm.updateFamily": {
        if (type === "crm.updateContact") {
          const contactId = String(config.contactId ?? "");
          if (!contactId) throw new Error("contactId is required for crm.updateContact");
          const updated = await updateContact(ctx.tenantId, contactId, {
            firstName:
              typeof config.firstName === "string" ? config.firstName : undefined,
            lastName:
              typeof config.lastName === "string" ? config.lastName : undefined,
            email: typeof config.email === "string" ? config.email : undefined,
            phone: typeof config.phone === "string" ? config.phone : undefined,
            status: typeof config.status === "string" ? config.status : undefined,
            tags: Array.isArray(config.tags)
              ? (config.tags.filter((v): v is string => typeof v === "string"))
              : undefined,
            notes: typeof config.notes === "string" ? config.notes : undefined,
          });
          return { ok: true, output: { contactId, updated } };
        }
        if (type === "crm.updateStudent") {
          const studentId = String(config.studentId ?? "");
          if (!studentId) throw new Error("studentId is required for crm.updateStudent");
          const updated = await updateStudent(studentId, ctx.tenantId, {
            first_name:
              typeof config.firstName === "string" ? config.firstName : undefined,
            last_name:
              typeof config.lastName === "string" ? config.lastName : undefined,
            email: typeof config.email === "string" ? config.email : undefined,
            phone: typeof config.phone === "string" ? config.phone : undefined,
            status: typeof config.status === "string" ? config.status : undefined,
            notes: typeof config.notes === "string" ? config.notes : undefined,
          });
          return { ok: true, output: { studentId, updated } };
        }
        const familyId = String(config.familyId ?? "");
        if (!familyId) throw new Error("familyId is required for crm.updateFamily");
        const updated = await updateFamily(familyId, ctx.tenantId, {
          name: typeof config.name === "string" ? config.name : undefined,
          primary_email: typeof config.email === "string" ? config.email : undefined,
          primary_phone: typeof config.phone === "string" ? config.phone : undefined,
          billing_status:
            typeof config.billingStatus === "string"
              ? config.billingStatus
              : undefined,
        });
        return { ok: true, output: { familyId, updated } };
      }
      case "billing.createInvoice":
      case "billing.applyCredit": {
        if (type === "billing.createInvoice") {
          const amountCents = Number(config.amountCents ?? config.totalCents ?? 0);
          const invoice = await createInvoiceRow(ctx.tenantId, {
            family_id:
              typeof config.familyId === "string" ? config.familyId : null,
            student_id:
              typeof config.studentId === "string" ? config.studentId : null,
            subscription_id:
              typeof config.subscriptionId === "string"
                ? config.subscriptionId
                : null,
            status: typeof config.status === "string" ? config.status : "draft",
            currency:
              typeof config.currency === "string" ? config.currency : "USD",
            amount_cents: Number.isFinite(amountCents) ? Math.max(0, amountCents) : 0,
            subtotal_cents:
              typeof config.subtotalCents === "number"
                ? config.subtotalCents
                : undefined,
            tax_cents:
              typeof config.taxCents === "number" ? config.taxCents : undefined,
            discount_cents:
              typeof config.discountCents === "number"
                ? config.discountCents
                : undefined,
            due_at: typeof config.dueAt === "string" ? config.dueAt : null,
            notes: typeof config.notes === "string" ? config.notes : null,
            metadata: { automationRunId: ctx.runId, ...(config.metadata as object) },
          });
          return { ok: true, output: { invoiceId: invoice.id, status: invoice.status } };
        }
        const amountCents = Number(config.amountCents ?? 0);
        if (!Number.isFinite(amountCents) || amountCents <= 0) {
          throw new Error("amountCents must be a positive number for billing.applyCredit");
        }
        const credit = await createCredit(ctx.tenantId, {
          amount_cents: Math.round(amountCents),
          family_id: typeof config.familyId === "string" ? config.familyId : null,
          student_id: typeof config.studentId === "string" ? config.studentId : null,
          invoice_id: typeof config.invoiceId === "string" ? config.invoiceId : null,
          reason: typeof config.reason === "string" ? config.reason : "automation",
          metadata: { automationRunId: ctx.runId, ...(config.metadata as object) },
        });
        return { ok: true, output: { creditId: credit.id, amountCents: credit.amount_cents } };
      }
      case "billing.notifyCustomer": {
        const recipientId = String(config.recipientId ?? config.profileId ?? "");
        if (!recipientId) throw new Error("recipientId is required for billing.notifyCustomer");
        const senderId = String(config.senderId ?? ctx.triggeredBy ?? "system");
        const messageBody = String(
          config.body ??
            `Billing update for invoice ${String(config.invoiceId ?? "").trim() || "account"}.`,
        );
        const sent = await sendMessageOps(ctx.tenantId, senderId, {
          recipientIds: [recipientId],
          body: messageBody,
          channelType: "in_app",
        });
        return { ok: true, output: { threadId: sent.thread.id, messageId: sent.message.id } };
      }
      case "billing.updateSubscription": {
        const subscriptionId = String(config.subscriptionId ?? "");
        if (!subscriptionId) throw new Error("subscriptionId is required for billing.updateSubscription");
        const updated = await updateBillingSubscription({
          tenantId: ctx.tenantId,
          subscriptionId,
          status: typeof config.status === "string" ? config.status : undefined,
          planId:
            typeof config.planId === "string" || config.planId === null
              ? (config.planId as string | null)
              : undefined,
        });
        return { ok: true, output: { subscriptionId: updated.id, status: updated.status } };
      }
      case "billing.generateInvoice": {
        const periodStart = String(config.periodStart ?? "");
        const periodEnd = String(config.periodEnd ?? "");
        if (!periodStart || !periodEnd) {
          throw new Error("periodStart and periodEnd are required for billing.generateInvoice");
        }
        const invoice = await generateBillingInvoice({
          tenantId: ctx.tenantId,
          period: { start: periodStart, end: periodEnd },
          subscriptionId:
            typeof config.subscriptionId === "string"
              ? config.subscriptionId
              : undefined,
          familyId:
            typeof config.familyId === "string" ? config.familyId : undefined,
          studentId:
            typeof config.studentId === "string" ? config.studentId : undefined,
        });
        return { ok: true, output: { invoiceId: invoice.id, status: invoice.status } };
      }
      case "schedule.createEvent":
      case "schedule.updateEvent": {
        if (type === "schedule.createEvent") {
          const statusValue =
            config.status === "scheduled" ||
            config.status === "confirmed" ||
            config.status === "cancelled" ||
            config.status === "completed" ||
            config.status === "no_show" ||
            config.status === "rescheduled"
              ? config.status
              : "scheduled";
          const kindValue =
            config.kind === "lesson" ||
            config.kind === "group" ||
            config.kind === "makeup" ||
            config.kind === "evaluation" ||
            config.kind === "hold" ||
            config.kind === "event" ||
            config.kind === "other"
              ? config.kind
              : "lesson";
          const event = await createEvent(
            ctx.tenantId,
            {
              title: String(config.title ?? "Lesson"),
              startTime: String(config.startTime ?? ""),
              endTime: String(config.endTime ?? ""),
              teacherId:
                typeof config.teacherId === "string" ? config.teacherId : null,
              studentId:
                typeof config.studentId === "string" ? config.studentId : null,
              familyId:
                typeof config.familyId === "string" ? config.familyId : null,
              roomId: typeof config.roomId === "string" ? config.roomId : null,
              locationId:
                typeof config.locationId === "string" ? config.locationId : null,
              status: statusValue,
              notes: typeof config.notes === "string" ? config.notes : null,
              kind: kindValue,
            },
            { allowConflict: config.allowConflict === true },
          );
          return { ok: true, output: { eventId: event.id } };
        }
        const eventId = String(config.eventId ?? "");
        if (!eventId) throw new Error("eventId is required for schedule.updateEvent");
        const nextStatus =
          config.status === "scheduled" ||
          config.status === "confirmed" ||
          config.status === "cancelled" ||
          config.status === "completed" ||
          config.status === "no_show" ||
          config.status === "rescheduled"
            ? config.status
            : undefined;
        const nextKind =
          config.kind === "lesson" ||
          config.kind === "group" ||
          config.kind === "makeup" ||
          config.kind === "evaluation" ||
          config.kind === "hold" ||
          config.kind === "event" ||
          config.kind === "other"
            ? config.kind
            : undefined;
        const updated = await updateEvent(
          ctx.tenantId,
          eventId,
          {
            title: typeof config.title === "string" ? config.title : undefined,
            startTime:
              typeof config.startTime === "string" ? config.startTime : undefined,
            endTime:
              typeof config.endTime === "string" ? config.endTime : undefined,
            teacherId:
              typeof config.teacherId === "string" ? config.teacherId : undefined,
            studentId:
              typeof config.studentId === "string" ? config.studentId : undefined,
            familyId:
              typeof config.familyId === "string" ? config.familyId : undefined,
            roomId: typeof config.roomId === "string" ? config.roomId : undefined,
            locationId:
              typeof config.locationId === "string" ? config.locationId : undefined,
            status: nextStatus,
            notes:
              typeof config.notes === "string" || config.notes === null
                ? (config.notes as string | null)
                : undefined,
            kind: nextKind,
          },
          { allowConflict: config.allowConflict === true },
        );
        return { ok: true, output: { eventId: updated.id, status: updated.status } };
      }
      case "content.renderTemplate": {
        const templateId = String(config.templateId ?? "");
        if (!templateId) throw new Error("templateId required");
        const versionId =
          config.versionId !== undefined ? String(config.versionId) : undefined;
        const contextInput = (config.context ?? ctx.payload) as TemplateContext;
        const mergeContext: TemplateContext = {
          ...contextInput,
          tenant: {
            id: ctx.tenantId,
            ...((contextInput.tenant ?? {}) as Record<string, unknown>),
          },
        };
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
        const url = String(config.url ?? "");
        if (!url) throw new Error("url is required for http.request");
        const method = String(config.method ?? "POST").toUpperCase();
        const headers = (config.headers as Record<string, string> | undefined) ?? {};
        const body =
          config.body !== undefined
            ? typeof config.body === "string"
              ? String(config.body)
              : JSON.stringify(config.body)
            : undefined;
        const init: RequestInit = {
          method,
          headers: { "content-type": "application/json", ...headers },
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
        const seconds = Number(config.seconds ?? 0);
        const delayMs = Math.max(0, Math.floor(seconds * 1000));
        return { ok: true, output: { delayMs }, delayMs };
      }
      case "automation.branch": {
        const path = String(config.path ?? "");
        const actual = valueAtPath(ctx.payload, path);
        const equals = config.equals;
        const match =
          equals === undefined ? Boolean(actual) : actual === equals;
        const branchTo = match
          ? (action.branches?.true ?? null)
          : (action.branches?.false ?? null);
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code)
        : undefined;
    return { ok: false, error: { message, code } };
  }
}
