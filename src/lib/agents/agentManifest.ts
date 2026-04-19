export type AgentManifest = {
  id: string;
  name: string;
  description: string;
  personality: string;
  actions?: string[];
};

const manifests: Record<string, AgentManifest> = {};

export function registerAgentManifest(manifest: AgentManifest) {
  manifests[manifest.id] = manifest;
}

export function getAgentManifest(agentId: string): AgentManifest | null {
  return manifests[agentId] ?? null;
}

export function getAllAgentManifests(): Record<string, AgentManifest> {
  return { ...manifests };
}

