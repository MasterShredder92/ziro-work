export type LifecycleStageId =
  | "intake"
  | "lead-work"
  | "scheduling"
  | "enrollment"
  | "service-delivery"
  | "relationship"
  | "retention"
  | "win-back";

export type LifecycleBlocker = {
  code: string;
  message: string;
  severity?: "info" | "warn" | "error";
};

export type LifecycleContext = {
  tenantId: string;
  studentId: string;

  student: Record<string, unknown> | null;
  lead: Record<string, unknown> | null;
  trial: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
  events: Record<string, unknown>[];
  attendance: Record<string, unknown>[];

  teacherAssigned: boolean;
  scheduled: boolean;
  enrolled: boolean;
  serviceStarted: boolean;

  riskScore: number;
  riskBand: "low" | "medium" | "high";
  signals: {
    missedLessons30d: number;
    overdueInvoices: number;
    inactivityDays: number | null;
    negativeEvents30d: number;
  };
};

export type LifecycleStageDefinition = {
  id: LifecycleStageId;
  name: string;
  description: string;
  autoAdvance: boolean;

  /** True if the student has reached this stage (or beyond). */
  entry: (ctx: LifecycleContext) => boolean;
  /** True if this stage is complete and can move forward. */
  exit: (ctx: LifecycleContext) => boolean;
  /** Current blockers preventing progress or safe action. */
  blockers: (ctx: LifecycleContext) => LifecycleBlocker[];
};

export type ComputedLifecycle = {
  stage: LifecycleStageDefinition;
  blockers: LifecycleBlocker[];
  next: LifecycleStageDefinition | null;
  autoAdvance: boolean;
};

