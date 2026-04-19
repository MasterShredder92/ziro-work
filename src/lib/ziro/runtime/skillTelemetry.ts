export type SkillExecutionPhase = "start" | "success" | "failure";

export type SkillExecutionRecord = {
  id: string;
  phase: SkillExecutionPhase;
  agentId: string | null;
  agentSlug: string | null;
  skillId: string | null;
  skillKey: string | null;
  source: "db" | "pack" | null;
  conversationId: string | null;
  profileId: string | null;
  tenantId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  error: { name: string | null; message: string; stack: string | null } | null;
  metadata: Record<string, unknown> | null;
};

const MAX_BUFFER = 500;

type GlobalWithBuffer = typeof globalThis & {
  __ziro_skill_exec_buffer?: SkillExecutionRecord[];
  __ziro_skill_exec_counter?: number;
};

const g = globalThis as GlobalWithBuffer;

function getBuffer(): SkillExecutionRecord[] {
  if (!g.__ziro_skill_exec_buffer) g.__ziro_skill_exec_buffer = [];
  return g.__ziro_skill_exec_buffer;
}

function nextId(): string {
  g.__ziro_skill_exec_counter = (g.__ziro_skill_exec_counter ?? 0) + 1;
  return `skx_${Date.now().toString(36)}_${g.__ziro_skill_exec_counter.toString(36)}`;
}

function push(record: SkillExecutionRecord): SkillExecutionRecord {
  const buffer = getBuffer();
  buffer.push(record);
  if (buffer.length > MAX_BUFFER) {
    buffer.splice(0, buffer.length - MAX_BUFFER);
  }
  return record;
}

export type SkillStartInput = {
  agentId?: string | null;
  agentSlug?: string | null;
  skillId?: string | null;
  skillKey?: string | null;
  source?: "db" | "pack" | null;
  conversationId?: string | null;
  profileId?: string | null;
  tenantId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function recordSkillStart(input: SkillStartInput): SkillExecutionRecord {
  const record: SkillExecutionRecord = {
    id: nextId(),
    phase: "start",
    agentId: input.agentId ?? null,
    agentSlug: input.agentSlug ?? null,
    skillId: input.skillId ?? null,
    skillKey: input.skillKey ?? null,
    source: input.source ?? null,
    conversationId: input.conversationId ?? null,
    profileId: input.profileId ?? null,
    tenantId: input.tenantId ?? null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMs: null,
    error: null,
    metadata: input.metadata ?? null,
  };
  return push(record);
}

export type SkillSuccessInput = {
  start: SkillExecutionRecord;
  metadata?: Record<string, unknown> | null;
};

export function recordSkillSuccess(input: SkillSuccessInput): SkillExecutionRecord {
  const endedAt = new Date();
  const started = new Date(input.start.startedAt).getTime();
  const record: SkillExecutionRecord = {
    ...input.start,
    id: `${input.start.id}.ok`,
    phase: "success",
    endedAt: endedAt.toISOString(),
    durationMs: Math.max(0, endedAt.getTime() - started),
    error: null,
    metadata: { ...(input.start.metadata ?? {}), ...(input.metadata ?? {}) },
  };
  return push(record);
}

export type SkillFailureInput = {
  start: SkillExecutionRecord;
  error: unknown;
  metadata?: Record<string, unknown> | null;
};

function normalizeError(error: unknown): {
  name: string | null;
  message: string;
  stack: string | null;
} {
  if (error instanceof Error) {
    return {
      name: error.name ?? null,
      message: error.message ?? String(error),
      stack: error.stack ?? null,
    };
  }
  if (typeof error === "string") {
    return { name: null, message: error, stack: null };
  }
  try {
    return { name: null, message: JSON.stringify(error), stack: null };
  } catch {
    return { name: null, message: String(error), stack: null };
  }
}

export function recordSkillFailure(input: SkillFailureInput): SkillExecutionRecord {
  const endedAt = new Date();
  const started = new Date(input.start.startedAt).getTime();
  const normalized = normalizeError(input.error);
  const record: SkillExecutionRecord = {
    ...input.start,
    id: `${input.start.id}.err`,
    phase: "failure",
    endedAt: endedAt.toISOString(),
    durationMs: Math.max(0, endedAt.getTime() - started),
    error: normalized,
    metadata: { ...(input.start.metadata ?? {}), ...(input.metadata ?? {}) },
  };
  return push(record);
}

export function getRecentSkillExecutions(limit = 100): SkillExecutionRecord[] {
  const buffer = getBuffer();
  if (limit <= 0) return [];
  if (limit >= buffer.length) return buffer.slice();
  return buffer.slice(buffer.length - limit);
}

export function clearSkillExecutions(): void {
  const buffer = getBuffer();
  buffer.length = 0;
}
