export type AgentAvatarInput = {
  /** Agent slug or id (current convention uses slug), e.g. "star", "ziro" */
  slug?: string | null;
  /** Back-compat: some call sites may pass `agentId` instead of `slug`. */
  agentId?: string | null;
};

function normalizeSlug(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return s.length ? s : null;
}

/**
 * Resolve the avatar filename for an agent.
 *
 * NOTE: This is a read-only path resolver only; it does not fetch or write data.
 * Fallback behavior: returns null when it cannot safely determine a filename.
 */
export function getAgentAvatarFilename(input: AgentAvatarInput): string | null {
  const slug = normalizeSlug(input.slug ?? input.agentId);
  if (!slug) return null;

  // Ziro resolves to the Music School OS asset path.
  if (slug === "ziro") return "ziro.png";

  // Keep other agents unchanged: no inferred mapping without an established convention.
  return null;
}

/**
 * Resolve the public URL for an agent avatar (under /public).
 *
 * Fallback behavior stays intact by returning null when no mapping exists.
 */
export function getAgentAvatarUrl(input: AgentAvatarInput): string | null {
  const slug = normalizeSlug(input.slug ?? input.agentId);
  const filename = getAgentAvatarFilename({ slug });
  if (!slug || !filename) return null;

  if (slug === "ziro") {
    return `/static/agents/ziro/${filename}`;
  }

  return null;
}

// --- New unified signatures (preferred) ---
export function getAgentAvatarFilenameByAgentId(agentId: string): string | null {
  return getAgentAvatarFilename({ agentId });
}

export function getAgentAvatarUrlByAgentId(agentId: string): string | null {
  return getAgentAvatarUrl({ agentId });
}

