/**
 * Derives AgentMetadata from the canonical agentDefinitions.
 * Single source of truth — accent colors, taglines, roles all come from agentDefinitions.ts
 */
import { AGENT_DEFINITIONS } from "./agentDefinitions";
function buildMeta(id) {
    const def = AGENT_DEFINITIONS[id];
    if (!def)
        throw new Error(`No agent definition found for id: ${id}`);
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
export const AGENT_METADATA = Object.fromEntries(Object.keys(AGENT_DEFINITIONS).map((id) => [id, buildMeta(id)]));
export function getAgentMetadata(id) {
    var _a;
    return (_a = AGENT_METADATA[id]) !== null && _a !== void 0 ? _a : null;
}
export function listAgentMetadata() {
    return Object.values(AGENT_METADATA);
}
export function getAgentImagePath(id) {
    const meta = AGENT_METADATA[id];
    if (!meta)
        return null;
    return meta.imagePath;
}
