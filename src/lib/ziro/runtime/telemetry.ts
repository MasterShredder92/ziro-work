import type { ToolCall } from "./conversationPipeline";

export type SkillInvocationEvent = {
  kind: "invocation";
  timestamp: string;
  agentId: string | null;
  skillId: string | null;
  conversationId: string | null;
  profileId: string | null;
  input: string;
  output: string;
  toolCalls: ToolCall[];
  usage: { inputTokens: number; outputTokens: number } | null;
};

export type SkillErrorEvent = {
  kind: "error";
  timestamp: string;
  agentId: string | null;
  skillId: string | null;
  conversationId: string | null;
  profileId: string | null;
  message: string;
  stack: string | null;
  name: string | null;
};

export type TelemetryEvent = SkillInvocationEvent | SkillErrorEvent;

const MAX_BUFFER = 200;

type GlobalWithBuffer = typeof globalThis & {
  __ziro_telemetry_buffer?: TelemetryEvent[];
};

const g = globalThis as GlobalWithBuffer;

function getBuffer(): TelemetryEvent[] {
  if (!g.__ziro_telemetry_buffer) g.__ziro_telemetry_buffer = [];
  return g.__ziro_telemetry_buffer;
}

function push(event: TelemetryEvent): void {
  const buffer = getBuffer();
  buffer.push(event);
  if (buffer.length > MAX_BUFFER) {
    buffer.splice(0, buffer.length - MAX_BUFFER);
  }
}

export type RecordSkillInvocationInput = {
  agentId?: string | null;
  skillId?: string | null;
  conversationId?: string | null;
  profileId?: string | null;
  input: string;
  output: string;
  toolCalls?: ToolCall[];
  usage?: { inputTokens: number; outputTokens: number } | null;
};

export function recordSkillInvocation(
  params: RecordSkillInvocationInput,
): SkillInvocationEvent {
  const event: SkillInvocationEvent = {
    kind: "invocation",
    timestamp: new Date().toISOString(),
    agentId: params.agentId ?? null,
    skillId: params.skillId ?? null,
    conversationId: params.conversationId ?? null,
    profileId: params.profileId ?? null,
    input: params.input,
    output: params.output,
    toolCalls: params.toolCalls ?? [],
    usage: params.usage ?? null,
  };
  push(event);
  return event;
}

export type RecordErrorInput = {
  agentId?: string | null;
  skillId?: string | null;
  conversationId?: string | null;
  profileId?: string | null;
  error: unknown;
};

function normalizeError(error: unknown): {
  message: string;
  stack: string | null;
  name: string | null;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack ?? null,
      name: error.name ?? null,
    };
  }
  if (typeof error === "string") {
    return { message: error, stack: null, name: null };
  }
  try {
    return { message: JSON.stringify(error), stack: null, name: null };
  } catch {
    return { message: String(error), stack: null, name: null };
  }
}

export function recordError(params: RecordErrorInput): SkillErrorEvent {
  const normalized = normalizeError(params.error);
  const event: SkillErrorEvent = {
    kind: "error",
    timestamp: new Date().toISOString(),
    agentId: params.agentId ?? null,
    skillId: params.skillId ?? null,
    conversationId: params.conversationId ?? null,
    profileId: params.profileId ?? null,
    message: normalized.message,
    stack: normalized.stack,
    name: normalized.name,
  };
  push(event);
  return event;
}

export function getRecentTelemetry(limit = 100): TelemetryEvent[] {
  const buffer = getBuffer();
  if (limit <= 0) return [];
  if (limit >= buffer.length) return buffer.slice();
  return buffer.slice(buffer.length - limit);
}

export function clearTelemetry(): void {
  const buffer = getBuffer();
  buffer.length = 0;
}
