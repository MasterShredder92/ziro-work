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
import { getToolsForAgent } from "./tools/definitions";
import { executeTool } from "./tools/executor";

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

function extractTextFromContent(content: Anthropic.ContentBlock[]): string {
  return content
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

/** Run the agentic tool loop: call LLM, execute tools, repeat until text response */
async function runAgenticLoop(
  model: string,
  maxTokens: number,
  temperature: number | undefined,
  system: string | undefined,
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[],
  tenantId: string,
): Promise<{ text: string; usage: Anthropic.Usage }> {
  const currentMessages = [...messages];
  let totalUsage: Anthropic.Usage | null = null;

  // Max 5 tool call rounds to prevent infinite loops
  for (let round = 0; round < 5; round++) {
    const completion = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: currentMessages,
      ...(tools.length > 0 ? { tools } : {}),
    });

    // Accumulate usage — spread full Usage object to satisfy type
    totalUsage = totalUsage
      ? { ...completion.usage, input_tokens: totalUsage.input_tokens + completion.usage.input_tokens, output_tokens: totalUsage.output_tokens + completion.usage.output_tokens }
      : completion.usage;

    // If no tool calls, return the text response
    if (completion.stop_reason !== "tool_use") {
      return {
        text: extractTextFromContent(completion.content),
        usage: totalUsage ?? completion.usage,
      };
    }

    // Process tool calls
    const toolUseBlocks = completion.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    if (toolUseBlocks.length === 0) {
      return {
        text: extractTextFromContent(completion.content),
        usage: totalUsage ?? completion.usage,
      };
    }

    // Add assistant message with tool calls to history
    currentMessages.push({
      role: "assistant",
      content: completion.content,
    });

    // Execute all tool calls and collect results
    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const result = await executeTool(
          block.name,
          block.input as Record<string, unknown>,
          tenantId,
        );
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      }),
    );

    // Add tool results to history
    currentMessages.push({
      role: "user",
      content: toolResults,
    });
  }

  // Fallback: ask for final response without tools
  const finalCompletion = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: currentMessages,
  });

  totalUsage = totalUsage
    ? { ...finalCompletion.usage, input_tokens: totalUsage.input_tokens + finalCompletion.usage.input_tokens, output_tokens: totalUsage.output_tokens + finalCompletion.usage.output_tokens }
    : finalCompletion.usage;

  return {
    text: extractTextFromContent(finalCompletion.content),
    usage: totalUsage ?? finalCompletion.usage,
  };
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
    // Tool usage instructions appended to system prompt
    `You have access to tools that let you take real actions in ZiroWork. When a user asks you to update a student, reschedule a lesson, or look up information — USE THE TOOLS. Do not ask the user to do it themselves. Do not say you "can't" do something if you have a tool for it. Execute the action, confirm what you did, and show the result.`,
  ]);

  // Get tools for this agent
  const agentName = effectiveAgent?.name ?? null;
  const tools = getToolsForAgent(agentName);

  const messages: Anthropic.MessageParam[] = [
    ...priorTurns,
    { role: "user", content: input.input },
  ];

  const { text: assistantText, usage } = await runAgenticLoop(
    input.model ?? DEFAULT_MODEL,
    input.maxTokens ?? 1024,
    input.temperature,
    system,
    messages,
    tools,
    input.tenantId,
  );

  const assistantMessage = await appendAIMessage(input.tenantId, {
    conversation_id: conversation.id,
    profile_id: input.profileId,
    role: "assistant",
    content: assistantText,
    model: input.model ?? DEFAULT_MODEL,
    usage: (usage as unknown as Json) ?? null,
    metadata: asJsonObject({
      agent_id: effectiveAgent?.id ?? null,
      skill_id: skill?.id ?? null,
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
    usage: usage ?? null,
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
