import type { PageRecommendedSkill } from "./pageIntelligence";

/** Shown when the skill appears only from the static page map. */
export const CONTEXTUAL_SKILL_REASON_PAGE = "Recommended for this page";
/** Shown when the skill is surfaced only from recent invocations (incl. orphans off-map). */
export const CONTEXTUAL_SKILL_REASON_RECENT = "Suggested based on your recent actions";
/** Shown when the skill is both on the page map and in recent history. */
export const CONTEXTUAL_SKILL_REASON_BOTH =
  "Recommended for this page • Recently used";

export type ContextualRecommendedSkill = PageRecommendedSkill & {
  reason: string;
};

export type RecentSkillInvocation = {
  agent: string;
  skillId: string;
  title: string;
  at: number;
};

const STORAGE_KEY = "ziro:agentOS:recentSkillInvocations";
const MAX_STORED = 32;
const MAX_SHOWN = 6;
/** Recent skills not on the current page's static list — cap so orphans do not crowd out page defaults. */
const MAX_ORPHAN_RECENT = 2;

function skillKey(s: { agent: string; skillId: string }) {
  return `${s.agent}:${s.skillId}`;
}

export function loadRecentSkillInvocations(): RecentSkillInvocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is RecentSkillInvocation =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as RecentSkillInvocation).agent === "string" &&
        typeof (x as RecentSkillInvocation).skillId === "string" &&
        typeof (x as RecentSkillInvocation).title === "string" &&
        typeof (x as RecentSkillInvocation).at === "number",
    );
  } catch {
    return [];
  }
}

export function saveRecentSkillInvocations(rows: RecentSkillInvocation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

/**
 * Push or refresh a skill invocation (dedupes by agent+skillId, newest first).
 */
export function pushRecentSkillInvocation(
  prev: RecentSkillInvocation[],
  entry: Omit<RecentSkillInvocation, "at">,
): RecentSkillInvocation[] {
  const at = Date.now();
  const next = [
    { ...entry, at },
    ...prev.filter((x) => skillKey(x) !== skillKey(entry)),
  ].slice(0, MAX_STORED);
  return next;
}

/**
 * Merge static page recommendations with recent invocations: recent-first, then fill from the page list.
 * Includes a small number of "orphan" recent skills not on the current page list.
 */
export function mergeContextualRecommendedSkills(
  base: PageRecommendedSkill[] | undefined,
  recent: RecentSkillInvocation[],
): ContextualRecommendedSkill[] {
  const b = base ?? [];
  const baseKeys = new Set(b.map((x) => skillKey(x)));
  const seen = new Set<string>();
  const out: ContextualRecommendedSkill[] = [];
  let orphanCount = 0;

  const sortedRecent = [...recent].sort((a, c) => c.at - a.at);

  for (const r of sortedRecent) {
    if (out.length >= MAX_SHOWN) break;
    const k = skillKey(r);
    if (seen.has(k)) continue;
    const inBase = baseKeys.has(k);
    if (!inBase) {
      if (orphanCount >= MAX_ORPHAN_RECENT) continue;
      orphanCount += 1;
    }
    seen.add(k);
    const reason = inBase ? CONTEXTUAL_SKILL_REASON_BOTH : CONTEXTUAL_SKILL_REASON_RECENT;
    out.push({ agent: r.agent, skillId: r.skillId, title: r.title, reason });
  }

  for (const s of b) {
    if (out.length >= MAX_SHOWN) break;
    const k = skillKey(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...s, reason: CONTEXTUAL_SKILL_REASON_PAGE });
  }

  return out;
}
