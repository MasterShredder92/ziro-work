import type Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { getServiceClient } from "@/lib/supabase";
import { routeTask } from "@/lib/routing/routeTask";
import { resolveAgent, type ResolvedAgent } from "./agentRegistry";
import {
  resolveSkillOrPack,
  type ResolvedSkill,
  type SkillPackMatch,
} from "./skillRegistry";
import {
  recordSkillStart,
  recordSkillSuccess,
  recordSkillFailure,
  type SkillExecutionRecord,
} from "./skillTelemetry";

export type RunTurnInput = {
  conversationId?: string | null;
  agent?: string | null;
  skill?: string | null;
  input: string;
  tenantId?: string | null;
  profileId?: string | null;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  title?: string | null;
  metadata?: Record<string, unknown>;
};

export type TurnMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string | null;
};

export type ToolCall = {
  id: string;
  name: string;
  input: unknown;
};

export type TurnMetadata = {
  agentId: string | null;
  agentSlug: string | null;
  skillId: string | null;
  skillSlug: string | null;
  runtime: string | null;
  routingReason: string | null;
  routingScore: number | null;
  stopReason: string | null;
  usage: { inputTokens: number; outputTokens: number } | null;
  model: string;
};

export type TurnResult = {
  conversationId: string;
  userMessage: TurnMessage;
  assistantMessage: TurnMessage;
  toolCalls: ToolCall[];
  metadata: TurnMetadata;
};

type TaskThreadRow = {
  id: string;
  task_id: string | null;
  agent_id: string | null;
  parent_chat_id: string | null;
  thread_title: string;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  summary: string | null;
  created_at: string | null;
};

type TaskMessageRow = {
  id: string;
  thread_id: string;
  sender_type: string;
  sender_name: string | null;
  message_type: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 1024;
const HISTORY_LIMIT = 40;

function deriveTitle(input: string, override?: string | null): string {
  if (override && override.trim().length > 0) return override.trim().slice(0, 200);
  const firstLine = input.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const trimmed = firstLine.trim();
  if (trimmed.length === 0) return "Ziro conversation";
  return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
}

async function loadThread(
  conversationId: string,
): Promise<TaskThreadRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("task_threads")
    .select(
      "id, task_id, agent_id, parent_chat_id, thread_title, status, started_at, ended_at, summary, created_at",
    )
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as TaskThreadRow | null;
}

async function createThread(params: {
  title: string;
  agentId: string | null;
}): Promise<TaskThreadRow> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("task_threads")
    .insert({
      thread_title: params.title,
      agent_id: params.agentId,
      status: "open",
    })
    .select(
      "id, task_id, agent_id, parent_chat_id, thread_title, status, started_at, ended_at, summary, created_at",
    )
    .single();
  if (error) throw error;
  return data as TaskThreadRow;
}

async function ensureThread(
  input: RunTurnInput,
  resolvedAgent: ResolvedAgent | null,
): Promise<TaskThreadRow> {
  if (input.conversationId) {
    const existing = await loadThread(input.conversationId);
    if (existing) return existing;
  }
  return createThread({
    title: deriveTitle(input.input, input.title),
    agentId: resolvedAgent?.id ?? null,
  });
}

async function loadRecentMessages(
  threadId: string,
  limit: number,
): Promise<TaskMessageRow[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("task_messages")
    .select(
      "id, thread_id, sender_type, sender_name, message_type, content, metadata, created_at",
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as TaskMessageRow[]).reverse();
}

async function insertMessage(params: {
  threadId: string;
  senderType: "user" | "assistant" | "system" | "tool";
  senderName: string | null;
  messageType: string;
  content: string;
  metadata: Record<string, unknown>;
}): Promise<TaskMessageRow> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("task_messages")
    .insert({
      thread_id: params.threadId,
      sender_type: params.senderType,
      sender_name: params.senderName,
      message_type: params.messageType,
      content: params.content,
      metadata: params.metadata,
    })
    .select(
      "id, thread_id, sender_type, sender_name, message_type, content, metadata, created_at",
    )
    .single();
  if (error) throw error;
  return data as TaskMessageRow;
}

function rowToMessage(row: TaskMessageRow): TurnMessage {
  const role: TurnMessage["role"] =
    row.sender_type === "user" ? "user" : "assistant";
  return {
    id: row.id,
    conversationId: row.thread_id,
    role,
    content: row.content,
    createdAt: row.created_at,
  };
}

function toChatRole(senderType: string): "user" | "assistant" | null {
  if (senderType === "user") return "user";
  if (senderType === "assistant") return "assistant";
  return null;
}

function buildPriorTurns(
  rows: TaskMessageRow[],
): Array<{ role: "user" | "assistant"; content: string }> {
  const turns: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const row of rows) {
    const role = toChatRole(row.sender_type);
    if (!role) continue;
    const content = (row.content ?? "").trim();
    if (content.length === 0) continue;
    turns.push({ role, content });
  }
  return turns;
}

function buildSystemPrompt(
  parts: Array<string | null | undefined>,
): string | undefined {
  const cleaned = parts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter((p) => p.length > 0);
  if (cleaned.length === 0) return undefined;
  return cleaned.join("\n\n");
}

function extractText(blocks: Anthropic.ContentBlock[]): string {
  return blocks
    .map((b) => (b.type === "text" ? b.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractToolCalls(blocks: Anthropic.ContentBlock[]): ToolCall[] {
  const calls: ToolCall[] = [];
  for (const block of blocks) {
    if (block.type === "tool_use") {
      calls.push({
        id: block.id,
        name: block.name,
        input: block.input,
      });
    }
  }
  return calls;
}

export async function runTurn(input: RunTurnInput): Promise<TurnResult> {
  let skillExecution: SkillExecutionRecord | null = null;
  try {
    if (!input || typeof input.input !== "string" || input.input.length === 0) {
      throw new Error("runTurn: 'input' string is required");
    }

    const businessContext = input.tenantId ?? null;

    const resolvedAgent = input.agent
      ? await resolveAgent(input.agent, { businessContext })
      : null;

    const resolvedSkillOrPack = input.skill
      ? await resolveSkillOrPack(input.skill, { businessContext })
      : null;
    const resolvedSkill: ResolvedSkill | null =
      resolvedSkillOrPack?.source === "db" ? resolvedSkillOrPack.skill : null;
    const packMatch: SkillPackMatch | null =
      resolvedSkillOrPack?.source === "pack" ? resolvedSkillOrPack.match : null;

    const thread = await ensureThread(input, resolvedAgent);

    skillExecution = recordSkillStart({
      agentId: resolvedAgent?.id ?? null,
      agentSlug: resolvedAgent?.slug ?? packMatch?.agent ?? null,
      skillId: resolvedSkill?.id ?? null,
      skillKey:
        resolvedSkill?.slug ??
        resolvedSkill?.key ??
        (packMatch ? `${packMatch.agent}.${packMatch.key}` : input.skill ?? null),
      source: packMatch ? "pack" : resolvedSkill ? "db" : null,
      conversationId: thread.id,
      profileId: input.profileId ?? null,
      tenantId: input.tenantId ?? null,
      metadata: {
        skillTitle: packMatch?.definition.title ?? resolvedSkill?.name ?? null,
      },
    });

    const title = deriveTitle(input.input, input.title);

    const history = await loadRecentMessages(thread.id, HISTORY_LIMIT);

    const userRow = await insertMessage({
      threadId: thread.id,
      senderType: "user",
      senderName: input.profileId ?? null,
      messageType: "instruction",
      content: input.input,
      metadata: {
        ...(input.metadata ?? {}),
        agent_hint: input.agent ?? null,
        skill_hint: input.skill ?? null,
        tenant_id: input.tenantId ?? null,
        profile_id: input.profileId ?? null,
      },
    });

    if (packMatch) {
      const packOutput = await packMatch.definition.handler({
        input: input.input,
        tenantId: input.tenantId ?? "",
        profileId: input.profileId ?? "",
        conversationId: thread.id,
      });
      const packToolCalls: ToolCall[] = Array.isArray(packOutput.toolCalls)
        ? (packOutput.toolCalls as ToolCall[])
        : [];
      const payload = packOutput.result;
      const assistantContent =
        typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
      const packAgentSlug = resolvedAgent?.slug ?? packMatch.agent;
      const packAssistantMetadata: Record<string, unknown> = {
        agent_id: resolvedAgent?.id ?? null,
        agent_slug: packAgentSlug,
        skill_id: null,
        skill_slug: null,
        skill_pack: packMatch.agent,
        skill_key: packMatch.key,
        skill_title: packMatch.definition.title,
        runtime: "skill_pack",
        routing_reason: "skill_pack_match",
        routing_score: null,
        stop_reason: null,
        model: "ziro-skillpack",
        usage: null,
        tool_calls: packToolCalls,
        source: "pack",
        handler_metadata: packOutput.metadata ?? null,
      };
      const packAssistantRow = await insertMessage({
        threadId: thread.id,
        senderType: "assistant",
        senderName: resolvedAgent?.name ?? packMatch.agent,
        messageType: packToolCalls.length > 0 ? "tool_request" : "response",
        content: assistantContent,
        metadata: packAssistantMetadata,
      });
      if (skillExecution) {
        recordSkillSuccess({
          start: skillExecution,
          metadata: {
            assistantMessageId: packAssistantRow.id,
            toolCallCount: packToolCalls.length,
          },
        });
      }
      const packMetadata: TurnMetadata = {
        agentId: resolvedAgent?.id ?? null,
        agentSlug: packAgentSlug,
        skillId: null,
        skillSlug: null,
        runtime: "skill_pack",
        routingReason: "skill_pack_match",
        routingScore: null,
        stopReason: null,
        usage: null,
        model: "ziro-skillpack",
      };
      return {
        conversationId: thread.id,
        userMessage: rowToMessage(userRow),
        assistantMessage: rowToMessage(packAssistantRow),
        toolCalls: packToolCalls,
        metadata: packMetadata,
      };
    }

    const routed = await routeTask(title, input.input);

    const system = buildSystemPrompt([
      resolvedAgent?.systemPrompt,
      resolvedAgent?.instructions,
      resolvedSkill?.systemPromptFragment ?? resolvedSkill?.promptFragment,
      routed.composedPrompt,
    ]);

    const priorTurns = buildPriorTurns(history);

    const model = input.model ?? DEFAULT_MODEL;
    const maxTokens = input.maxTokens ?? DEFAULT_MAX_TOKENS;

    const completion = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: input.temperature,
      system,
      messages: [...priorTurns, { role: "user", content: input.input }],
    });

    const assistantText = extractText(completion.content);
    const toolCalls = extractToolCalls(completion.content);

    const routeSkillId =
      "skills" in routed.route && Array.isArray(routed.route.skills)
        ? (routed.route.skills[0]?.id as string | undefined) ?? null
        : null;
    const routeRuntime =
      "runtime" in routed.route
        ? ((routed.route.runtime as string | null) ?? null)
        : null;
    const routeReason =
      "reason" in routed.route
        ? ((routed.route.reason as string | null) ?? null)
        : null;
    const routeScore =
      "score" in routed.route && typeof routed.route.score === "number"
        ? routed.route.score
        : null;

    const agentId = resolvedAgent?.id ?? routed.agentId ?? null;
    const agentSlug = resolvedAgent?.slug ?? null;
    const skillId = resolvedSkill?.id ?? routeSkillId;
    const skillSlug = resolvedSkill?.slug ?? null;

    const usage = completion.usage
      ? {
          inputTokens: completion.usage.input_tokens,
          outputTokens: completion.usage.output_tokens,
        }
      : null;

    const assistantMetadata: Record<string, unknown> = {
      agent_id: agentId,
      agent_slug: agentSlug,
      skill_id: skillId,
      skill_slug: skillSlug,
      runtime: routeRuntime,
      routing_reason: routeReason,
      routing_score: routeScore,
      routing_task_type: routed.classification.task_type,
      stop_reason: completion.stop_reason,
      model: completion.model,
      usage: completion.usage ?? null,
      tool_calls: toolCalls,
    };

    const assistantRow = await insertMessage({
      threadId: thread.id,
      senderType: "assistant",
      senderName: resolvedAgent?.name ?? "ziro",
      messageType: toolCalls.length > 0 ? "tool_request" : "response",
      content: assistantText,
      metadata: assistantMetadata,
    });

    const metadata: TurnMetadata = {
      agentId,
      agentSlug,
      skillId,
      skillSlug,
      runtime: routeRuntime,
      routingReason: routeReason,
      routingScore: routeScore,
      stopReason: completion.stop_reason ?? null,
      usage,
      model: completion.model,
    };

    if (skillExecution) {
      recordSkillSuccess({
        start: skillExecution,
        metadata: {
          assistantMessageId: assistantRow.id,
          toolCallCount: toolCalls.length,
          model: completion.model,
          stopReason: completion.stop_reason ?? null,
          inputTokens: usage?.inputTokens ?? null,
          outputTokens: usage?.outputTokens ?? null,
        },
      });
    }

    return {
      conversationId: thread.id,
      userMessage: rowToMessage(userRow),
      assistantMessage: rowToMessage(assistantRow),
      toolCalls,
      metadata,
    };
  } catch (error) {
    if (skillExecution) {
      recordSkillFailure({ start: skillExecution, error });
    }
    throw error;
  }
}
