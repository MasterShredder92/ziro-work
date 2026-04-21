import { getServiceClient } from "@/lib/supabase";
import { getSkillPack, getSkillPackSkill, listSkillPackSkills, resolveSkillPackSkill, skillPacks, } from "@/lib/ziro/skills";
const SKILL_SELECT = "id, slug, key, name, description, category, system_prompt_fragment, prompt_fragment, allowed_tools, input_schema, output_schema, preferred_runtime, runtime, tags, is_active, approval_status, business_context";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value) {
    return UUID_RE.test(value);
}
function rowToResolved(row) {
    var _a, _b, _c, _d, _e, _f;
    return {
        id: row.id,
        slug: row.slug,
        key: row.key,
        name: (_c = (_b = (_a = row.name) !== null && _a !== void 0 ? _a : row.slug) !== null && _b !== void 0 ? _b : row.key) !== null && _c !== void 0 ? _c : row.id,
        description: row.description,
        category: row.category,
        systemPromptFragment: row.system_prompt_fragment,
        promptFragment: row.prompt_fragment,
        allowedTools: (_d = row.allowed_tools) !== null && _d !== void 0 ? _d : null,
        inputSchema: (_e = row.input_schema) !== null && _e !== void 0 ? _e : null,
        outputSchema: (_f = row.output_schema) !== null && _f !== void 0 ? _f : null,
        preferredRuntime: row.preferred_runtime,
        runtime: row.runtime,
        tags: Array.isArray(row.tags) ? row.tags : [],
        isActive: !!row.is_active,
        approvalStatus: row.approval_status,
        businessContext: row.business_context,
    };
}
async function loadAgentSkills(agentId) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("agent_skills")
        .select("agent_id, skill_id, priority")
        .eq("agent_id", agentId)
        .order("priority", { ascending: true });
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []).map((r) => ({
        agentId: r.agent_id,
        skillId: r.skill_id,
        priority: r.priority,
    }));
}
async function fetchSkillsByIds(ids, opts = {}) {
    if (ids.length === 0)
        return [];
    const supabase = getServiceClient();
    let query = supabase.from("skills").select(SKILL_SELECT).in("id", ids);
    if (opts.activeOnly !== false)
        query = query.eq("is_active", true);
    if (opts.businessContext)
        query = query.eq("business_context", opts.businessContext);
    const { data, error } = await query;
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []).map((r) => rowToResolved(r));
}
export async function resolveSkill(slugOrKeyOrId, opts = {}) {
    if (!slugOrKeyOrId)
        return null;
    const supabase = getServiceClient();
    const activeOnly = opts.activeOnly !== false;
    if (isUuid(slugOrKeyOrId)) {
        let query = supabase
            .from("skills")
            .select(SKILL_SELECT)
            .eq("id", slugOrKeyOrId)
            .limit(1);
        if (activeOnly)
            query = query.eq("is_active", true);
        if (opts.businessContext)
            query = query.eq("business_context", opts.businessContext);
        const { data, error } = await query.maybeSingle();
        if (error)
            throw error;
        return data ? rowToResolved(data) : null;
    }
    for (const column of ["slug", "key"]) {
        let query = supabase
            .from("skills")
            .select(SKILL_SELECT)
            .eq(column, slugOrKeyOrId)
            .limit(1);
        if (activeOnly)
            query = query.eq("is_active", true);
        if (opts.businessContext)
            query = query.eq("business_context", opts.businessContext);
        const { data, error } = await query.maybeSingle();
        if (error)
            throw error;
        if (data)
            return rowToResolved(data);
    }
    return null;
}
export async function listSkillsForAgent(agentId, opts = {}) {
    if (!agentId)
        return [];
    const links = await loadAgentSkills(agentId);
    if (links.length === 0)
        return [];
    const orderedIds = links.map((l) => l.skillId);
    const skills = await fetchSkillsByIds(orderedIds, {
        businessContext: opts.businessContext,
        activeOnly: opts.activeOnly,
    });
    const order = new Map();
    orderedIds.forEach((id, idx) => order.set(id, idx));
    return skills.sort((a, b) => { var _a, _b; return ((_a = order.get(a.id)) !== null && _a !== void 0 ? _a : 0) - ((_b = order.get(b.id)) !== null && _b !== void 0 ? _b : 0); });
}
export async function resolveSkillOrPack(slugOrKeyOrId, opts = {}) {
    if (!slugOrKeyOrId)
        return null;
    const packHit = resolveSkillPackSkill(slugOrKeyOrId);
    if (packHit) {
        return {
            source: "pack",
            match: {
                agent: packHit.agentSlug,
                key: packHit.skillKey,
                definition: packHit.skill,
            },
        };
    }
    const skill = await resolveSkill(slugOrKeyOrId, opts);
    return skill ? { source: "db", skill } : null;
}
export function findSkillInPacks(slugOrKey) {
    const hit = resolveSkillPackSkill(slugOrKey);
    if (!hit)
        return null;
    return { agent: hit.agentSlug, key: hit.skillKey, definition: hit.skill };
}
function packEntryToResolved(agentSlug, skillKey, skill) {
    return {
        id: `pack:${agentSlug}.${skillKey}`,
        slug: `${agentSlug}.${skillKey}`,
        key: skillKey,
        name: skill.title,
        description: skill.description,
        category: "pack",
        systemPromptFragment: null,
        promptFragment: null,
        allowedTools: null,
        inputSchema: null,
        outputSchema: null,
        preferredRuntime: "pack",
        runtime: "pack",
        tags: [agentSlug, "skill-pack"],
        isActive: true,
        approvalStatus: "approved",
        businessContext: null,
    };
}
export function listSkillPacks() {
    return listSkillPackSkills().map(({ agentSlug, skillKey, skill }) => ({
        agentSlug,
        skillKey,
        title: skill.title,
        description: skill.description,
        skill,
    }));
}
export function listResolvedSkillPackSkills() {
    return listSkillPackSkills().map(({ agentSlug, skillKey, skill }) => packEntryToResolved(agentSlug, skillKey, skill));
}
export function resolvePackSkill(identifier) {
    const resolved = resolveSkillPackSkill(identifier);
    if (!resolved)
        return null;
    return {
        agentSlug: resolved.agentSlug,
        skillKey: resolved.skillKey,
        title: resolved.skill.title,
        description: resolved.skill.description,
        skill: resolved.skill,
    };
}
export function getSkillPackForAgent(agentSlug) {
    return getSkillPack(agentSlug);
}
export async function runSkillPack(identifier, args) {
    const entry = resolveSkillPackSkill(identifier);
    if (!entry) {
        throw new Error(`runSkillPack: unknown skill pack identifier '${identifier}'`);
    }
    return entry.skill.handler(args);
}
export function getSkillPackSkillDirect(agentSlug, skillKey) {
    return getSkillPackSkill(agentSlug, skillKey);
}
export async function listSkillsForAgentWithPack(agentId, agentSlug, opts = {}) {
    const dbSkills = await listSkillsForAgent(agentId, {
        businessContext: opts.businessContext,
        activeOnly: opts.activeOnly,
    });
    if (opts.includePack === false || !agentSlug)
        return dbSkills;
    const pack = getSkillPack(agentSlug);
    if (!pack)
        return dbSkills;
    const packSkills = Object.entries(pack).map(([key, skill]) => packEntryToResolved(agentSlug, key, skill));
    const existingIds = new Set(dbSkills.map((s) => s.id));
    const merged = [...dbSkills];
    for (const ps of packSkills) {
        if (!existingIds.has(ps.id))
            merged.push(ps);
    }
    return merged;
}
export async function resolveSkillFromDbOrPack(slugOrKeyOrId, opts = {}) {
    const fromDb = await resolveSkill(slugOrKeyOrId, opts);
    if (fromDb)
        return fromDb;
    const packHit = resolveSkillPackSkill(slugOrKeyOrId);
    if (!packHit)
        return null;
    return packEntryToResolved(packHit.agentSlug, packHit.skillKey, packHit.skill);
}
export { skillPacks };
