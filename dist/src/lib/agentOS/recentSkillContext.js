/** Shown when the skill appears only from the static page map. */
export const CONTEXTUAL_SKILL_REASON_PAGE = "Recommended for this page";
/** Shown when the skill is surfaced only from recent invocations (incl. orphans off-map). */
export const CONTEXTUAL_SKILL_REASON_RECENT = "Suggested based on your recent actions";
/** Shown when the skill is both on the page map and in recent history. */
export const CONTEXTUAL_SKILL_REASON_BOTH = "Recommended for this page • Recently used";
const STORAGE_KEY = "ziro:agentOS:recentSkillInvocations";
const MAX_STORED = 32;
const MAX_SHOWN = 6;
/** Recent skills not on the current page's static list — cap so orphans do not crowd out page defaults. */
const MAX_ORPHAN_RECENT = 2;
function skillKey(s) {
    return `${s.agent}:${s.skillId}`;
}
export function loadRecentSkillInvocations() {
    if (typeof window === "undefined")
        return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((x) => typeof x === "object" &&
            x !== null &&
            typeof x.agent === "string" &&
            typeof x.skillId === "string" &&
            typeof x.title === "string" &&
            typeof x.at === "number");
    }
    catch (_a) {
        return [];
    }
}
export function saveRecentSkillInvocations(rows) {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }
    catch (_a) {
        /* ignore */
    }
}
/**
 * Push or refresh a skill invocation (dedupes by agent+skillId, newest first).
 */
export function pushRecentSkillInvocation(prev, entry) {
    const at = Date.now();
    const next = [
        Object.assign(Object.assign({}, entry), { at }),
        ...prev.filter((x) => skillKey(x) !== skillKey(entry)),
    ].slice(0, MAX_STORED);
    return next;
}
/**
 * Merge static page recommendations with recent invocations: recent-first, then fill from the page list.
 * Includes a small number of "orphan" recent skills not on the current page list.
 */
export function mergeContextualRecommendedSkills(base, recent) {
    const b = base !== null && base !== void 0 ? base : [];
    const baseKeys = new Set(b.map((x) => skillKey(x)));
    const seen = new Set();
    const out = [];
    let orphanCount = 0;
    const sortedRecent = [...recent].sort((a, c) => c.at - a.at);
    for (const r of sortedRecent) {
        if (out.length >= MAX_SHOWN)
            break;
        const k = skillKey(r);
        if (seen.has(k))
            continue;
        const inBase = baseKeys.has(k);
        if (!inBase) {
            if (orphanCount >= MAX_ORPHAN_RECENT)
                continue;
            orphanCount += 1;
        }
        seen.add(k);
        const reason = inBase ? CONTEXTUAL_SKILL_REASON_BOTH : CONTEXTUAL_SKILL_REASON_RECENT;
        out.push({ agent: r.agent, skillId: r.skillId, title: r.title, reason });
    }
    for (const s of b) {
        if (out.length >= MAX_SHOWN)
            break;
        const k = skillKey(s);
        if (seen.has(k))
            continue;
        seen.add(k);
        out.push(Object.assign(Object.assign({}, s), { reason: CONTEXTUAL_SKILL_REASON_PAGE }));
    }
    return out;
}
