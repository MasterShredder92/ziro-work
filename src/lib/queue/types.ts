export type JobStatus = "pending" | "running" | "succeeded" | "failed" | "dead";

export interface JobRecord {
  id: string;
  tenantId: string | null;
  kind: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  priority: number;
  runAt: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  lockedBy: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface DeadLetterJobRecord {
  id: string;
  originalJobId: string;
  tenantId: string | null;
  kind: string;
  payload: Record<string, unknown>;
  attempts: number;
  lastError: string | null;
  failedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface JobRunRecord {
  id: string;
  jobId: string;
  attempt: number;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  log: Record<string, unknown> | null;
}

export interface EnqueueArgs<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  tenantId?: string | null;
  kind: string;
  payload: TPayload;
  /** ISO timestamp — when should the job become eligible. Defaults to now. */
  runAt?: string;
  /** Lower number = higher priority. Default 100. */
  priority?: number;
  /** Max attempts including the first. Default 5. */
  maxAttempts?: number;
}
