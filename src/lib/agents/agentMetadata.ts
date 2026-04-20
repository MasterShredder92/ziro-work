/**
 * Derives AgentMetadata from the canonical agentDefinitions.
 * Single source of truth — accent colors, taglines, roles all come from agentDefinitions.ts
 */
import { AGENT_DEFINITIONS } from "./agentDefinitions";

export type AgentMetadata = {
  id: string;
  displayName: string;
  imagePath: string;
  name: string;
  avatar: string;
  accent: string;
  glow: string;
  tagline: string;
  role: string;
  suggestedPrompts: string[];
};

function buildMeta(id: string): AgentMetadata {
  const def = AGENT_DEFINITIONS[id];
  if (!def) throw new Error(`No agent definition found for id: ${id}`);
  return {
    id,
    displayName: def.name,
    imagePath: `/static/agents/${id}.png`,
    name: def.name,
    avatar: `${id}.png`,
    accent: def.accent,
    glow: def.glow,
    tagline: def.tagline,
    role: def.role,
    suggestedPrompts: def.suggestedPrompts,
  };
}

export const AGENT_METADATA: Record<string, AgentMetadata> = Object.fromEntries(
  Object.keys(AGENT_DEFINITIONS).map((id) => [id, buildMeta(id)])
);

export function getAgentMetadata(id: string): AgentMetadata | null {
  return AGENT_METADATA[id] ?? null;
}

export function listAgentMetadata(): AgentMetadata[] {
  return Object.values(AGENT_METADATA);
}

export function getAgentImagePath(id: string): string | null {
  const meta = AGENT_METADATA[id];
  if (!meta) return null;
  return meta.imagePath;
}
