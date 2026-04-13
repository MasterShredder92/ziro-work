import type { Skill, Runtime } from "@/types/orchestrator";

// Select relevant skills from a template's skills based on the chosen runtime
export function selectSkills(
  templateSkills: Skill[],
  runtime: Runtime,
  keywords: string[]
): Skill[] {
  if (templateSkills.length === 0) return [];

  // Prefer skills that match the runtime, but include claude_code skills as fallback
  const runtimeMatch = templateSkills.filter(
    (s) => s.runtime === runtime || s.runtime === "claude_code"
  );

  // If no runtime match, return all skills (template already validated)
  const candidates = runtimeMatch.length > 0 ? runtimeMatch : templateSkills;

  // Sort by keyword relevance — skills whose tags overlap with task keywords rank higher
  return candidates.sort((a, b) => {
    const aMatch = (a.tags || []).filter((t) => keywords.includes(t)).length;
    const bMatch = (b.tags || []).filter((t) => keywords.includes(t)).length;
    return bMatch - aMatch;
  });
}
