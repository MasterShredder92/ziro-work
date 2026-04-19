import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { clientFor } from "@data/_client";
import {
  appendAIMessage,
  createAIConversation,
  getAIConversationById,
  listAIMessages,
} from "@data/aiConversations";
import type { AIConversation, AIMessage, Json } from "@/lib/types/entities";
import { resolveAgent, touchAgentUsage } from "./agentRegistry";
import { resolvePageBindings } from "./pageIntelligence";
import { touchSkillUsage } from "./skillRegistry";

export type ConversationTurnInput = {
  tenantId: string;
  profileId: string;
  conversationId?: string;
  agentId?: string;
  agentName?: string;
  skillKey?: string;
  pathname?: string;
  pageKey?: string;
  input: string;
  metadata?: Json;
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type ConversationTurnResult = {
  conversation: AIConversation;
  userMessage: AIMessage;
  assistantMessage: AIMessage;
  agentId: string | null;
  skillId: string | null;
  usage: Anthropic.Usage | null;
};

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

type JsonObject = { [k: string]: unknown };

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

async function ensureConversation(
  input: ConversationTurnInput,
): Promise<AIConversation> {
  if (input.conversationId) {
    const existing = await getAIConversationById(
      input.conversationId,
      input.tenantId,
    );
    if (existing) return existing;
  }
  return createAIConversation(input.tenantId, {
    profile_id: input.profileId,
    client_route: input.pathname ?? null,
    source: "ziro",
    metadata: (input.metadata ?? {}) as Json,
    page_context: (input.pageKey
      ? ({ page_key: input.pageKey } satisfies JsonObject)
      : {}) as Json,
  });
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

function normalizeTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export async function runTurn(
  input: ConversationTurnInput,
): Promise<ConversationTurnResult> {
  const conversation = await ensureConversation(input);

  const [agent, pageResolution] = await Promise.all([
    input.agentId || input.agentName
      ? resolveAgent(
          { id: input.agentId, name: input.agentName },
          input.tenantId,
        )
      : Promise.resolve(null),
    input.pathname || input.pageKey
      ? resolvePageBindings(
          { pathname: input.pathname, pageKey: input.pageKey },
          input.tenantId,
        )
      : Promise.resolve(null),
  ]);

  const effectiveAgent =
    agent ?? (pageResolution?.primaryAgent ? { ...pageResolution.primaryAgent, skills: [] } : null);

  const skill =
    input.skillKey && effectiveAgent && "skills" in effectiveAgent
      ? effectiveAgent.skills.find((s) => s.key === input.skillKey) ?? null
      : null;

  const history = await listAIMessages(conversation.id, input.tenantId, {
    limit: 40,
  });

  const userMessage = await appendAIMessage(input.tenantId, {
    conversation_id: conversation.id,
    profile_id: input.profileId,
    role: "user",
    content: input.input,
    metadata: (input.metadata ?? {}) as Json,
  });

  const priorTurns = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content ?? "",
    }));

  const system = buildSystemPrompt([
    effectiveAgent?.instructions,
    effectiveAgent && "business_context" in effectiveAgent
      ? effectiveAgent.business_context
      : null,
    skill?.system_prompt_fragment,
  ]);

  const completion = await anthropic.messages.create({
    model: input.model ?? DEFAULT_MODEL,
    max_tokens: input.maxTokens ?? 1024,
    temperature: input.temperature,
    system,
    messages: [
      ...priorTurns,
      { role: "user", content: input.input },
    ],
  });

  const assistantText = normalizeTextContent(completion.content);

  const assistantMessage = await appendAIMessage(input.tenantId, {
    conversation_id: conversation.id,
    profile_id: input.profileId,
    role: "assistant",
    content: assistantText,
    model: completion.model,
    usage: (completion.usage as unknown as Json) ?? null,
    metadata: asJsonObject({
      agent_id: effectiveAgent?.id ?? null,
      skill_id: skill?.id ?? null,
      stop_reason: completion.stop_reason,
    }) as Json,
  });

  if (effectiveAgent) {
    await touchAgentUsage(effectiveAgent.id, input.tenantId).catch(() => undefined);
  }
  if (skill) {
    await touchSkillUsage(skill.id, input.tenantId).catch(() => undefined);
  }

  return {
    conversation,
    userMessage,
    assistantMessage,
    agentId: effectiveAgent?.id ?? null,
    skillId: skill?.id ?? null,
    usage: completion.usage ?? null,
  };
}

export async function logAction(args: {
  tenantId: string;
  profileId: string;
  actionId: string;
  ok: boolean;
  conversationId?: string;
  idempotencyKey?: string;
  payload?: Json;
  result?: Json;
  errorCode?: string;
  errorMessage?: string;
}): Promise<void> {
  const supabase = clientFor(args.tenantId);
  await supabase.from("ai_action_logs").insert({
    tenant_id: args.tenantId,
    profile_id: args.profileId,
    action_id: args.actionId,
    ok: args.ok,
    conversation_id: args.conversationId ?? null,
    idempotency_key: args.idempotencyKey ?? null,
    payload: args.payload ?? null,
    result: args.result ?? null,
    error_code: args.errorCode ?? null,
    error_message: args.errorMessage ?? null,
  });
}
