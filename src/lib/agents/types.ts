/**
 * Agents: pure type definitions + normalizers.
 *
 * IMPORTANT: This module must remain free of UI imports, resolver logic, and DB calls.
 */

export type AgentID = string;
/** Alias used by non-agent subsystems. */
export type AgentId = AgentID;

export type AgentSlug = string;

/** Canonical roles used by Ziro agent records (extend as needed). */
export type AgentRole =
  | "orchestrator"
  | "specialist"
  | "assistant"
  | "system"
  | "user"
  | (string & {});

export type AgentStatus = "active" | "deployed" | "idle" | "retired" | (string & {});

export interface Agent {
  id: AgentID;
  slug?: AgentSlug | null;
  name: string;
  role: AgentRole;
  status?: AgentStatus;
  /** Optional UI accent color (hex). */
  color?: string | null;
  /** If present, indicates who owns/created the agent record. */
  owner_type?: string | null;
  /** Business context scope, e.g. "music_school". */
  business_context?: string | null;
  [key: string]: unknown;
}

/**
 * Normalize an agent id from arbitrary input.
 * Returns a trimmed string (lowercased) or null when unusable.
 *
 * NOTE: We intentionally do not validate UUID format here; callers may accept
 * non-UUID ids (e.g. "star") in some contexts.
 */
export function normalizeAgentId(input: string): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;
  return s.toLowerCase();
}

/**
 * Normalize an agent slug.
 * Returns a safe, URL-ish slug or null when unusable.
 */
export function normalizeAgentSlug(input: string): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  // Keep to a conservative slug charset; collapse invalid runs to "-".
  const cleaned = raw
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "")
    .slice(0, 80);
  return cleaned.length ? cleaned : null;
}

export type EventName = string;
export type TaskName = string;

export interface AgentContext {
  tenantId: string;
  userId?: string;
  role?: string;
  page?: string;
  data?: Record<string, unknown>;
  lifecycle?: {
    stage: string;
    blockers: { code: string; message: string; severity?: string }[];
    next: string | null;
    autoAdvance: boolean;
  };
  tools?: unknown;
  supabase?: unknown;
}

export interface AgentEvent {
  name: EventName;
  payload: unknown;
  timestamp: number;
}

export interface AgentTask {
  name: TaskName;
  payload: unknown;
  createdAt: number;
}

export interface AgentDefinition {
  id: AgentID;
  name: string;
  description: string;
  run: (ctx: AgentContext) => Promise<void>;
  onEvent?: (event: AgentEvent, ctx: AgentContext) => Promise<void>;
  onTask?: (task: AgentTask, ctx: AgentContext) => Promise<void>;
}

export interface ToolDefinition {
  name: string;
  run: (args: unknown, ctx: AgentContext) => Promise<unknown>;
}

export interface MemoryStore {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
}

