export type AutomationWorkflowRecord = {
  id: string;
  tenantId: string;
  name: string;
  enabled: boolean;
};

export type AutomationTriggerType =
  | "message.received"
  | "file.uploaded"
  | "appointment.created"
  | "appointment.updated";

export type AutomationActionType =
  | "sendMessage"
  | "createTask"
  | "updateAppointment"
  | "callWebhook";

export type AutomationTriggerRecord = {
  id: string;
  workflowId: string;
  type: AutomationTriggerType;
  config: Record<string, unknown>;
};

export type AutomationActionRecord = {
  id: string;
  workflowId: string;
  order: number;
  type: AutomationActionType;
  config: Record<string, unknown>;
};

export type AutomationRunRecord = {
  id: string;
  workflowId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  startedAt: string;
  finishedAt: string | null;
  logs: Array<Record<string, unknown>>;
};
