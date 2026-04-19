import type {
  AutomationWorkflowRow,
  AutomationWorkflowStatus,
  AutomationTriggerDef,
  AutomationActionDef,
} from "@data/automationWorkflows";
import type {
  AutomationRunRow,
  AutomationRunStatus,
  AutomationRunStep,
} from "@data/automationRuns";
import type {
  AutomationLogRow,
  AutomationLogLevel,
} from "@data/automationLogs";

export type AutomationWorkflow = AutomationWorkflowRow;
export type AutomationWorkflowInput = {
  name: string;
  description?: string | null;
  status?: AutomationWorkflowStatus;
  trigger: AutomationTriggerDef;
  actions: AutomationActionDef[];
  concurrencyLimit?: number | null;
  retryMax?: number;
  retryBackoffMs?: number;
  tags?: string[];
  createdBy?: string | null;
};

export type {
  AutomationWorkflowRow,
  AutomationWorkflowStatus,
  AutomationTriggerDef,
  AutomationActionDef,
  AutomationRunRow,
  AutomationRunStatus,
  AutomationRunStep,
  AutomationLogRow,
  AutomationLogLevel,
};

export type AutomationRun = AutomationRunRow;
export type AutomationLog = AutomationLogRow;

export type AutomationRunContext = {
  tenantId: string;
  workflowId: string;
  runId: string;
  triggerType: string;
  payload: Record<string, unknown>;
  triggeredBy?: string | null;
};

export type AutomationActionResult = {
  ok: boolean;
  output?: unknown;
  error?: { message: string; code?: string };
  delayMs?: number;
  branchTo?: string | null;
};

export type EnqueueRunInput = {
  tenantId: string;
  workflowId: string;
  triggerType: string;
  payload: Record<string, unknown>;
  triggeredBy?: string | null;
  maxAttempts?: number;
};

export type AutomationDashboardKpis = {
  totalWorkflows: number;
  activeWorkflows: number;
  pausedWorkflows: number;
  runsLast24h: number;
  successRatePct: number;
  failureCountLast24h: number;
  deadLetterCount: number;
  avgDurationMs: number;
};

export type AutomationDashboardData = {
  tenantId: string;
  generatedAt: string;
  workflows: AutomationWorkflow[];
  recentRuns: AutomationRun[];
  failures: AutomationRun[];
  kpis: AutomationDashboardKpis;
};

export const TRIGGER_TYPES = [
  "schedule.cron",
  "schedule.event",
  "message.received",
  "file.uploaded",
  "appointment.created",
  "appointment.updated",
  "crm.contact.created",
  "crm.student.updated",
  "crm.family.updated",
  "billing.invoice.created",
  "billing.payment.received",
  "billing.invoice.paid",
  "billing.invoice.failed",
  "billing.subscription.updated",
  "assessments.attempt.submitted",
  "assessments.attempt.graded",
  "messages.thread.created",
  "messages.message.sent",
  "progress.evidence.added",
  "custom.webhook",
] as const;

export type AutomationTriggerType = (typeof TRIGGER_TYPES)[number];

export const ACTION_TYPES = [
  "sendMessage",
  "createTask",
  "updateAppointment",
  "callWebhook",
  "messaging.send",
  "crm.updateContact",
  "crm.updateStudent",
  "crm.updateFamily",
  "billing.createInvoice",
  "billing.applyCredit",
  "billing.notifyCustomer",
  "billing.updateSubscription",
  "billing.generateInvoice",
  "schedule.createEvent",
  "schedule.updateEvent",
  "content.renderTemplate",
  "progress.addEvidence",
  "assessments.createAttempt",
  "assessments.gradeAttempt",
  "http.request",
  "automation.delay",
  "automation.branch",
] as const;

export type AutomationActionType = (typeof ACTION_TYPES)[number];

export type TriggerCatalogEntry = {
  type: AutomationTriggerType;
  label: string;
  description: string;
  category: "schedule" | "crm" | "billing" | "assessments" | "messages" | "progress" | "custom";
  configSchema?: Record<string, { label: string; type: "string" | "number" | "boolean"; required?: boolean; }>;
};

export type ActionCatalogEntry = {
  type: AutomationActionType;
  label: string;
  description: string;
  category: "messaging" | "crm" | "billing" | "schedule" | "content" | "progress" | "assessments" | "http" | "control";
  configSchema?: Record<string, { label: string; type: "string" | "number" | "boolean"; required?: boolean; }>;
};

export const TRIGGER_CATALOG: TriggerCatalogEntry[] = [
  { type: "message.received", label: "Message received", description: "Fires when a message is created.", category: "messages" },
  { type: "file.uploaded", label: "File uploaded", description: "Fires when a new file is uploaded.", category: "custom" },
  { type: "appointment.created", label: "Appointment created", description: "Fires when an appointment is created.", category: "schedule" },
  { type: "appointment.updated", label: "Appointment updated", description: "Fires when an appointment is updated.", category: "schedule" },
  { type: "schedule.cron", label: "Cron schedule", description: "Fire on a cron-like schedule.", category: "schedule", configSchema: { cron: { label: "Cron expression", type: "string", required: true } } },
  { type: "schedule.event", label: "Schedule event", description: "Fires when Scheduling OS creates/updates an event.", category: "schedule" },
  { type: "crm.contact.created", label: "Contact created", description: "Fires when a CRM contact is created.", category: "crm" },
  { type: "crm.student.updated", label: "Student updated", description: "Fires when a student record is updated.", category: "crm" },
  { type: "crm.family.updated", label: "Family updated", description: "Fires when a family record is updated.", category: "crm" },
  { type: "billing.invoice.created", label: "Invoice created", description: "Fires when an invoice is created.", category: "billing" },
  { type: "billing.payment.received", label: "Payment received", description: "Fires when a payment is received.", category: "billing" },
  { type: "billing.invoice.paid", label: "Invoice paid", description: "Fires when a Stripe invoice is marked paid.", category: "billing" },
  { type: "billing.invoice.failed", label: "Invoice failed", description: "Fires when a Stripe invoice payment fails.", category: "billing" },
  { type: "billing.subscription.updated", label: "Subscription updated", description: "Fires when Stripe updates a subscription state.", category: "billing" },
  { type: "assessments.attempt.submitted", label: "Attempt submitted", description: "Fires when an assessment attempt is submitted.", category: "assessments" },
  { type: "assessments.attempt.graded", label: "Attempt graded", description: "Fires when an assessment attempt is graded.", category: "assessments" },
  { type: "messages.thread.created", label: "Thread created", description: "Fires when a new message thread is created.", category: "messages" },
  { type: "messages.message.sent", label: "Message sent", description: "Fires when a message is sent.", category: "messages" },
  { type: "progress.evidence.added", label: "Evidence added", description: "Fires when progress evidence is added.", category: "progress" },
  { type: "custom.webhook", label: "Custom webhook", description: "POST to /api/automation/hooks/[id] to trigger.", category: "custom" },
];

export const ACTION_CATALOG: ActionCatalogEntry[] = [
  { type: "sendMessage", label: "Send message", description: "Send a message via Messaging OS.", category: "messaging", configSchema: { senderId: { label: "Sender ID", type: "string", required: true }, recipientId: { label: "Recipient ID", type: "string", required: true }, body: { label: "Body", type: "string", required: true } } },
  { type: "createTask", label: "Create task", description: "Create a task placeholder entry.", category: "control", configSchema: { title: { label: "Task title", type: "string", required: true } } },
  { type: "updateAppointment", label: "Update appointment", description: "Update appointment fields in Scheduling OS.", category: "schedule", configSchema: { appointmentId: { label: "Appointment ID", type: "string", required: true }, title: { label: "Title", type: "string" }, startsAt: { label: "Starts at", type: "string" }, endsAt: { label: "Ends at", type: "string" }, status: { label: "Status", type: "string" } } },
  { type: "callWebhook", label: "Call webhook", description: "POST to an external webhook URL.", category: "http", configSchema: { url: { label: "URL", type: "string", required: true }, method: { label: "Method", type: "string" } } },
  { type: "messaging.send", label: "Send message", description: "Send email, SMS, or in-app message.", category: "messaging", configSchema: { profileId: { label: "Profile ID", type: "string", required: true }, body: { label: "Body", type: "string", required: true }, channel: { label: "Channel", type: "string" } } },
  { type: "crm.updateContact", label: "Update contact", description: "Patch a CRM contact record.", category: "crm" },
  { type: "crm.updateStudent", label: "Update student", description: "Patch a student record.", category: "crm" },
  { type: "crm.updateFamily", label: "Update family", description: "Patch a family record.", category: "crm" },
  { type: "billing.createInvoice", label: "Create invoice", description: "Create a new invoice.", category: "billing" },
  { type: "billing.applyCredit", label: "Apply credit", description: "Apply credit to an account.", category: "billing" },
  { type: "billing.notifyCustomer", label: "Notify customer", description: "Send a billing notification message to a customer.", category: "billing" },
  { type: "billing.updateSubscription", label: "Update subscription", description: "Patch a subscription from automation.", category: "billing" },
  { type: "billing.generateInvoice", label: "Generate invoice", description: "Generate invoice from usage period.", category: "billing" },
  { type: "schedule.createEvent", label: "Create event", description: "Create a scheduled event.", category: "schedule" },
  { type: "schedule.updateEvent", label: "Update event", description: "Update a scheduled event.", category: "schedule" },
  { type: "content.renderTemplate", label: "Render template", description: "Render a Templates OS template.", category: "content", configSchema: { templateId: { label: "Template ID", type: "string", required: true } } },
  { type: "progress.addEvidence", label: "Add evidence", description: "Add a progress evidence item.", category: "progress" },
  { type: "assessments.createAttempt", label: "Create attempt", description: "Create an assessment attempt.", category: "assessments" },
  { type: "assessments.gradeAttempt", label: "Grade attempt", description: "Grade an assessment attempt.", category: "assessments" },
  { type: "http.request", label: "HTTP request", description: "Make an outbound HTTP request.", category: "http", configSchema: { url: { label: "URL", type: "string", required: true }, method: { label: "Method", type: "string" } } },
  { type: "automation.delay", label: "Delay", description: "Sleep for N seconds.", category: "control", configSchema: { seconds: { label: "Seconds", type: "number", required: true } } },
  { type: "automation.branch", label: "Branch", description: "If/else on payload field.", category: "control", configSchema: { path: { label: "Payload path", type: "string", required: true }, equals: { label: "Equals value", type: "string" } } },
];
