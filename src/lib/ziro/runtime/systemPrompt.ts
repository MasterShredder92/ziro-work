import type { ResolvedAgent } from "./agentRegistry";
import type { ResolvedSkill } from "./skillRegistry";
import type { TurnContext } from "./contextBridge";

export type BuildSystemPromptInput = {
  agent: ResolvedAgent | null | undefined;
  skill: ResolvedSkill | null | undefined;
  turnContext: TurnContext;
};

function safeStringify(value: unknown): string {
  try {
    const out = JSON.stringify(value);
    return typeof out === "string" ? out : "{}";
  } catch {
    return "{}";
  }
}

function trimString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildSystemPrompt(input: BuildSystemPromptInput): string {
  const { agent, skill, turnContext } = input;
  const parts: string[] = [];

  const agentPrompt = trimString(agent?.systemPrompt ?? null);
  if (agentPrompt) parts.push(agentPrompt);

  const skillDescription = trimString(skill?.description ?? null);
  if (skillDescription) parts.push(skillDescription);

  const pageJson = safeStringify(turnContext.page);
  parts.push(`PAGE_CONTEXT:\n${pageJson}`);

  const memoryJson = safeStringify(turnContext.memory);
  parts.push(`AGENT_MEMORY:\n${memoryJson}`);

  return parts.join("\n\n");
}
