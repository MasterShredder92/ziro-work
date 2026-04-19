import type { QuickAction } from "./pageIntelligence";

export type DomainActionKind =
  | "schedule.create"
  | "schedule.edit"
  | "crm.student.update"
  | "crm.family.update"
  | "crm.teacher.update"
  | "messages.send"
  | "messages.thread.action"
  | "files.share.create"
  | "files.permissions.update"
  | "billing.invoice.create"
  | "billing.payment.record"
  | "automation.workflow.trigger";

export type DomainActionSpec = {
  kind: DomainActionKind;
  detail: string;
  request: {
    method: "POST" | "PATCH";
    path: string;
    body?: Record<string, unknown>;
  };
  followup?: {
    method: "POST" | "PATCH";
    pathTemplate: string;
    body?: Record<string, unknown>;
  };
};

type ResolverInput = {
  action: QuickAction;
  pathname: string;
  tenantId: string;
};

function payloadOf(action: QuickAction): Record<string, unknown> {
  return action.payload && typeof action.payload === "object" ? action.payload : {};
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function pathId(pathname: string, re: RegExp): string | null {
  const m = pathname.match(re);
  return m?.[1] ?? null;
}

function nextIsoMinutes(minsFromNow: number): string {
  const d = new Date(Date.now() + minsFromNow * 60_000);
  return d.toISOString();
}

function resolveActionKind(
  action: QuickAction,
  payload: Record<string, unknown>,
): DomainActionKind | null {
  const explicit = asString(payload.domainAction);
  if (explicit) return explicit as DomainActionKind;
  const skill = asString(payload.skill);
  switch (skill) {
    case "scheduleFollowup":
      return "schedule.create";
    case "detectConflicts":
      return "schedule.edit";
    case "qualifyLead":
      return "crm.student.update";
    case "messageTeacher":
    case "messageFamily":
    case "messageStudent":
      return "messages.send";
    case "shareLinkMgmt":
      return "files.share.create";
    case "fileVersioning":
      return "files.permissions.update";
    case "invoiceAgingReport":
    case "listOutstanding":
      return "billing.payment.record";
    default:
      return null;
  }
}

export function resolveDomainActionSpec(input: ResolverInput): DomainActionSpec | null {
  if (input.action.intent !== "custom") return null;
  const payload = payloadOf(input.action);
  const kind = resolveActionKind(input.action, payload);
  if (!kind) return null;

  const now = Date.now();
  switch (kind) {
    case "schedule.create": {
      const title = asString(payload.title) ?? "Agent Follow-up Session";
      return {
        kind,
        detail: "Create schedule event",
        request: {
          method: "POST",
          path: "/api/schedule/events",
          body: {
            title,
            kind: asString(payload.kind) ?? "lesson",
            status: asString(payload.status) ?? "scheduled",
            startTime: asString(payload.startTime) ?? new Date(now + 60 * 60_000).toISOString(),
            endTime: asString(payload.endTime) ?? new Date(now + 105 * 60_000).toISOString(),
            teacherId: asString(payload.teacherId),
            studentId: asString(payload.studentId),
            familyId: asString(payload.familyId),
            roomId: asString(payload.roomId),
            locationId: asString(payload.locationId),
            notes: asString(payload.notes) ?? "Created by AgentOS scheduling action.",
          },
        },
      };
    }
    case "schedule.edit": {
      const eventId =
        asString(payload.eventId) ??
        pathId(input.pathname, /^\/schedule\/events\/([^/]+)$/) ??
        pathId(input.pathname, /^\/scheduling\/events\/([^/]+)$/);
      if (!eventId) return null;
      const patch = asRecord(payload.patch);
      const body = Object.keys(patch).length
        ? patch
        : {
            notes: asString(payload.notes) ?? "Updated by AgentOS scheduling action.",
            status: asString(payload.status) ?? "scheduled",
          };
      return {
        kind,
        detail: `Update schedule event ${eventId}`,
        request: {
          method: "PATCH",
          path: `/api/schedule/events/${eventId}`,
          body,
        },
      };
    }
    case "crm.student.update": {
      const id =
        asString(payload.studentId) ??
        pathId(input.pathname, /^\/crm\/students\/([^/]+)/) ??
        pathId(input.pathname, /^\/students\/([^/]+)/) ??
        pathId(input.pathname, /^\/student\/([^/]+)/);
      if (!id) return null;
      const patch = asRecord(payload.patch);
      const body = Object.keys(patch).length
        ? patch
        : {
            notes: asString(payload.notes) ?? "Updated from AgentOS CRM action.",
          };
      return {
        kind,
        detail: `Update student ${id}`,
        request: { method: "PATCH", path: `/api/crm/students/${id}`, body },
      };
    }
    case "crm.family.update": {
      const id =
        asString(payload.familyId) ??
        pathId(input.pathname, /^\/crm\/families\/([^/]+)/) ??
        pathId(input.pathname, /^\/families\/([^/]+)/) ??
        pathId(input.pathname, /^\/family\/([^/]+)/);
      if (!id) return null;
      const patch = asRecord(payload.patch);
      const body = Object.keys(patch).length
        ? patch
        : {
            scheduling_notes: asString(payload.scheduling_notes) ?? "Updated from AgentOS CRM action.",
          };
      return {
        kind,
        detail: `Update family ${id}`,
        request: { method: "PATCH", path: `/api/crm/families/${id}`, body },
      };
    }
    case "crm.teacher.update": {
      const id =
        asString(payload.teacherId) ??
        pathId(input.pathname, /^\/crm\/teachers\/([^/]+)/) ??
        pathId(input.pathname, /^\/teachers\/([^/]+)/) ??
        pathId(input.pathname, /^\/teacher\/([^/]+)/);
      if (!id) return null;
      const patch = asRecord(payload.patch);
      const body = Object.keys(patch).length
        ? patch
        : {
            director_notes: asString(payload.director_notes) ?? "Updated from AgentOS CRM action.",
          };
      return {
        kind,
        detail: `Update teacher ${id}`,
        request: { method: "PATCH", path: `/api/crm/teachers/${id}`, body },
      };
    }
    case "messages.send": {
      const threadId =
        asString(payload.threadId) ??
        pathId(input.pathname, /^\/messages\/threads\/([^/]+)/);
      if (threadId) {
        return {
          kind,
          detail: `Send thread message ${threadId}`,
          request: {
            method: "POST",
            path: `/api/messages/threads/${threadId}/messages`,
            body: {
              body: asString(payload.body) ?? "AgentOS follow-up message.",
              channelType: asString(payload.channelType) ?? "in_app",
            },
          },
        };
      }
      const participantIds = Array.isArray(payload.participantIds)
        ? payload.participantIds.filter((v): v is string => typeof v === "string" && v.length > 0)
        : [];
      if (participantIds.length === 0) return null;
      return {
        kind,
        detail: "Create thread and send message",
        request: {
          method: "POST",
          path: "/api/messages/threads",
          body: {
            subject: asString(payload.subject) ?? "AgentOS message thread",
            channelType: asString(payload.channelType) ?? "in_app",
            participantIds,
            contextType: asString(payload.contextType),
            contextId: asString(payload.contextId),
          },
        },
        followup: {
          method: "POST",
          pathTemplate: "/api/messages/threads/{threadId}/messages",
          body: {
            body: asString(payload.body) ?? "AgentOS follow-up message.",
            channelType: asString(payload.channelType) ?? "in_app",
          },
        },
      };
    }
    case "messages.thread.action": {
      const threadId =
        asString(payload.threadId) ??
        pathId(input.pathname, /^\/messages\/threads\/([^/]+)/);
      if (!threadId) return null;
      return {
        kind,
        detail: `Thread action for ${threadId}`,
        request: {
          method: "PATCH",
          path: `/api/messages/threads/${threadId}`,
          body: {
            action: asString(payload.threadAction) ?? "markRead",
            profileId: asString(payload.profileId),
            participantId: asString(payload.participantId),
          },
        },
      };
    }
    case "files.share.create": {
      const fileId =
        asString(payload.fileId) ??
        pathId(input.pathname, /^\/files\/([^/]+)$/);
      const folderId =
        asString(payload.folderId) ??
        pathId(input.pathname, /^\/files\/folder\/([^/]+)/);
      if (!fileId && !folderId) return null;
      return {
        kind,
        detail: "Create file share link",
        request: {
          method: "POST",
          path: "/api/files/share",
          body: {
            fileId,
            folderId,
            allowDownload: payload.allowDownload === true,
            expiresInSeconds:
              typeof payload.expiresInSeconds === "number" ? payload.expiresInSeconds : 7 * 24 * 3600,
            metadata: {
              source: "agent-os",
              createdAt: new Date().toISOString(),
            },
          },
        },
      };
    }
    case "files.permissions.update": {
      const fileId =
        asString(payload.fileId) ??
        pathId(input.pathname, /^\/files\/([^/]+)$/);
      if (!fileId) return null;
      return {
        kind,
        detail: `Update file permissions for ${fileId}`,
        request: {
          method: "PATCH",
          path: `/api/files/${fileId}`,
          body: {
            visibility: asString(payload.visibility) ?? "tenant",
            metadata: {
              permissionUpdatedBy: "agent-os",
              permissionUpdatedAt: new Date().toISOString(),
            },
            acl: Array.isArray(payload.acl) ? payload.acl : undefined,
          },
        },
      };
    }
    case "billing.invoice.create": {
      return {
        kind,
        detail: "Create billing invoice",
        request: {
          method: "POST",
          path: "/api/billing/invoices",
          body: {
            family_id: asString(payload.familyId),
            student_id: asString(payload.studentId),
            description: asString(payload.description) ?? "AgentOS generated invoice",
            due_at: asString(payload.dueAt) ?? nextIsoMinutes(7 * 24 * 60),
            lineItems: [
              {
                description: asString(payload.lineDescription) ?? "Service charge",
                quantity: typeof payload.quantity === "number" ? payload.quantity : 1,
                unit_amount_cents:
                  typeof payload.unitAmountCents === "number" ? payload.unitAmountCents : 7500,
              },
            ],
          },
        },
      };
    }
    case "billing.payment.record": {
      const invoiceId =
        asString(payload.invoiceId) ??
        pathId(input.pathname, /^\/billing\/invoices\/([^/]+)/) ??
        pathId(input.pathname, /^\/invoices\/([^/]+)/);
      if (!invoiceId) return null;
      return {
        kind,
        detail: `Record invoice payment ${invoiceId}`,
        request: {
          method: "POST",
          path: `/api/billing/invoices/${invoiceId}/pay`,
          body: {
            amount_cents: typeof payload.amountCents === "number" ? payload.amountCents : 7500,
            method: asString(payload.method) ?? "manual",
            notes: asString(payload.notes) ?? "Recorded by AgentOS billing action.",
            paid_at: asString(payload.paidAt) ?? new Date().toISOString(),
            family_id: asString(payload.familyId),
            student_id: asString(payload.studentId),
          },
        },
      };
    }
    case "automation.workflow.trigger": {
      const workflowId =
        asString(payload.workflowId) ??
        pathId(input.pathname, /^\/automation\/workflows\/([^/]+)/);
      if (!workflowId) return null;
      return {
        kind,
        detail: `Trigger workflow ${workflowId}`,
        request: {
          method: "POST",
          path: "/api/automation/run",
          body: {
            workflowId,
            tenantId: input.tenantId,
            payload: asRecord(payload.workflowPayload),
            triggeredBy: "agent-os",
          },
        },
      };
    }
    default:
      return null;
  }
}
