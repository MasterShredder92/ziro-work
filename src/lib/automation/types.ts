export const BUILT_IN_TRIGGERS = [
  "lead.created",
  "lead.updated",
  "student.created",
  "payment.received",
  "schedule.block.created",
  "message.received",
  "form.submitted",
] as const;

export type BuiltInTrigger = (typeof BUILT_IN_TRIGGERS)[number];

export type AutomationTrigger = {
  event: BuiltInTrigger | string;
  filters?: Record<string, unknown>;
};

export type AutomationConditionOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "nin"
  | "exists"
  | "not_exists"
  | "contains";

export type AutomationCondition = {
  path: string;
  op: AutomationConditionOp;
  value?: unknown;
};

export type AutomationActionKind =
  | "runSkill"
  | "sendMessage"
  | "sendTemplatedMessage"
  | "createNote"
  | "scheduleFollowup"
  | "createLead"
  | "tagProfile";

export type AutomationActionRunSkill = {
  kind: "runSkill";
  skillId: string;
  input?: string;
  extra?: Record<string, unknown>;
};

export type AutomationActionSendMessage = {
  kind: "sendMessage";
  profileId: string;
  body: string;
};

export type AutomationActionSendTemplatedMessage = {
  kind: "sendTemplatedMessage";
  profileId: string;
  templateId: string;
  versionId?: string;
  context?: Record<string, unknown>;
};

export type AutomationActionCreateNote = {
  kind: "createNote";
  entityId: string;
  body: string;
  entityType?: "student" | "lead" | "family" | "teacher" | string;
};

export type AutomationActionScheduleFollowup = {
  kind: "scheduleFollowup";
  profileId: string;
  date: string;
  note?: string;
};

export type AutomationActionCreateLead = {
  kind: "createLead";
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  tags?: string[];
  answers?: Record<string, unknown>;
};

export type AutomationActionTagProfile = {
  kind: "tagProfile";
  profileId: string;
  tag: string;
  remove?: boolean;
};

export type AutomationAction =
  | AutomationActionRunSkill
  | AutomationActionSendMessage
  | AutomationActionSendTemplatedMessage
  | AutomationActionCreateNote
  | AutomationActionScheduleFollowup
  | AutomationActionCreateLead
  | AutomationActionTagProfile;

export type AutomationRule = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type AutomationRuleInput = {
  name: string;
  description?: string | null;
  enabled?: boolean;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
  createdBy?: string | null;
};

export type AutomationContext = {
  tenantId: string;
  profileId?: string | null;
  event: string;
  payload: Record<string, unknown>;
  occurredAt: string;
  conversationId?: string | null;
  locationId?: string | null;
};

export type AutomationActionResult = {
  kind: AutomationActionKind | string;
  ok: boolean;
  durationMs: number;
  startedAt: string;
  output?: unknown;
  error?: { message: string; code?: string };
};

export type AutomationExecution = {
  ruleId: string;
  ruleName: string;
  tenantId: string;
  event: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  ok: boolean;
  matched: boolean;
  skipped: boolean;
  skipReason?: string;
  actionResults: AutomationActionResult[];
  error?: { message: string; code?: string };
};
