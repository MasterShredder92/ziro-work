import { star } from "./star";
import { ruby } from "./ruby";
import { bub } from "./bub";
import { stewie } from "./stewie";
import { vader } from "./vader";
import { ziro } from "./ziro";
export const skillPacks = {
    star,
    ruby,
    bub,
    stewie,
    vader,
    ziro,
};
export function listSkillPackAgents() {
    return Object.keys(skillPacks);
}
export function getSkillPack(agentSlug) {
    const pack = skillPacks[agentSlug];
    return pack !== null && pack !== void 0 ? pack : null;
}
export function getSkillPackSkill(agentSlug, skillKey) {
    var _a;
    const pack = getSkillPack(agentSlug);
    if (!pack)
        return null;
    return (_a = pack[skillKey]) !== null && _a !== void 0 ? _a : null;
}
export function listSkillPackSkills() {
    const out = [];
    for (const agentSlug of Object.keys(skillPacks)) {
        const pack = skillPacks[agentSlug];
        for (const skillKey of Object.keys(pack)) {
            out.push({ agentSlug, skillKey, skill: pack[skillKey] });
        }
    }
    return out;
}
const KEY_SPLIT_RE = /^([a-z0-9_-]+)[./:]([A-Za-z0-9_-]+)$/;
export function findSkillInPacks(slugOrKey) {
    if (!slugOrKey)
        return null;
    const normalized = slugOrKey.trim();
    if (normalized.length === 0)
        return null;
    const scoped = KEY_SPLIT_RE.exec(normalized);
    if (scoped) {
        const agent = scoped[1].toLowerCase();
        const key = scoped[2];
        const pack = skillPacks[agent];
        if (pack && pack[key])
            return { agent, key, definition: pack[key] };
    }
    for (const agent of Object.keys(skillPacks)) {
        const pack = skillPacks[agent];
        if (pack[normalized]) {
            return { agent, key: normalized, definition: pack[normalized] };
        }
    }
    return null;
}
export function resolveSkillPackSkill(identifier) {
    const hit = findSkillInPacks(identifier);
    if (!hit)
        return null;
    return { agentSlug: hit.agent, skillKey: hit.key, skill: hit.definition };
}
export async function runSkillPackSkill(identifier, args) {
    const resolved = resolveSkillPackSkill(identifier);
    if (!resolved) {
        throw new Error(`runSkillPackSkill: no skill pack entry for '${identifier}'`);
    }
    return resolved.skill.handler(args);
}
export { star, ruby, bub, stewie, vader, ziro };
