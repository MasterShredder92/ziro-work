import type { QuickAction } from "./pageIntelligence";

export type ResolvedCrossAppAction = {
  href: string;
  detail: string;
};

function readSkillId(action: QuickAction): string | null {
  const payload = action.payload;
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as { skill?: unknown }).skill;
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
}

function readDomainAction(action: QuickAction): string | null {
  const payload = action.payload;
  if (!payload || typeof payload !== "object") return null;
  const raw = (payload as { domainAction?: unknown }).domainAction;
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
}

export function resolveCrossAppAction(action: QuickAction): ResolvedCrossAppAction | null {
  if (action.intent === "nav" && action.href) {
    return { href: action.href, detail: "Opened destination" };
  }
  if (action.intent !== "custom") return null;
  const domainAction = readDomainAction(action);
  switch (domainAction) {
    case "schedule.create":
    case "schedule.edit":
      return { href: "/schedule", detail: "Opened scheduling workspace" };
    case "crm.student.update":
      return { href: "/crm/students", detail: "Opened student CRM" };
    case "crm.family.update":
      return { href: "/crm/families", detail: "Opened family CRM" };
    case "crm.teacher.update":
      return { href: "/crm/teachers", detail: "Opened teacher CRM" };
    case "messages.send":
    case "messages.thread.action":
      return { href: "/messages", detail: "Opened messaging workspace" };
    case "files.share.create":
    case "files.permissions.update":
      return { href: "/files", detail: "Opened files workspace" };
    case "billing.invoice.create":
    case "billing.payment.record":
      return { href: "/billing", detail: "Opened billing workspace" };
    case "automation.workflow.trigger":
      return { href: "/automation/workflows", detail: "Opened automation workflows" };
    default:
      break;
  }
  const skill = readSkillId(action);
  if (!skill) return null;
  switch (skill) {
    case "kpiSnapshot":
    case "usageReport":
      return { href: "/reports", detail: "Opened reporting surface" };
    case "detectConflicts":
      return { href: "/schedule?focus=conflicts", detail: "Opened conflict review" };
    case "findAvailability":
    case "scheduleFollowup":
      return { href: "/schedule?focus=availability", detail: "Opened scheduling workspace" };
    case "hotLeads":
    case "qualifyLead":
      return { href: "/crm/leads?filter=hot", detail: "Opened lead pipeline" };
    case "teacherLoadReport":
      return { href: "/crm/teachers", detail: "Opened teacher load view" };
    case "invoiceAgingReport":
    case "listOutstanding":
      return { href: "/billing/invoices?filter=overdue", detail: "Opened overdue invoices" };
    case "messageTeacher":
      return { href: "/messages?compose=teacher", detail: "Opened teacher messaging" };
    case "messageFamily":
      return { href: "/messages?compose=family", detail: "Opened family messaging" };
    case "messageStudent":
      return { href: "/messages?compose=student", detail: "Opened student messaging" };
    default:
      return null;
  }
}
