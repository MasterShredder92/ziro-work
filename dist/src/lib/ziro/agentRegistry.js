import { clientFor } from "@data/_client";
export async function listAgents(tenantId, opts) {
    const supabase = clientFor(tenantId);
    let query = supabase
        .from("ziro_agents")
        .select("*")
        .eq("tenant_id", tenantId);
    if (!(opts === null || opts === void 0 ? void 0 : opts.includeArchived))
        query = query.eq("is_archived", false);
    if (opts === null || opts === void 0 ? void 0 : opts.status)
        query = query.eq("status", opts.status);
    const { data, error } = await query.order("name", { ascending: true });
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
export async function getAgentById(id, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("ziro_agents")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function getAgentByName(name, tenantId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("ziro_agents")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("name", name)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
export async function resolveAgent(identifier, tenantId) {
    const agent = identifier.id
        ? await getAgentById(identifier.id, tenantId)
        : identifier.name
            ? await getAgentByName(identifier.name, tenantId)
            : null;
    if (!agent)
        return null;
    const supabase = clientFor(tenantId);
    const { data: links, error: linkErr } = await supabase
        .from("ziro_agent_skills")
        .select("skill_id, is_primary")
        .eq("tenant_id", tenantId)
        .eq("agent_id", agent.id);
    if (linkErr)
        throw linkErr;
    const skillIds = (links !== null && links !== void 0 ? links : []).map((l) => l.skill_id);
    if (skillIds.length === 0)
        return Object.assign(Object.assign({}, agent), { skills: [] });
    const { data: skills, error: skillErr } = await supabase
        .from("ziro_skills")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("id", skillIds);
    if (skillErr)
        throw skillErr;
    const primaryMap = new Map((links !== null && links !== void 0 ? links : []).map((l) => [
        l.skill_id,
        l.is_primary,
    ]));
    return Object.assign(Object.assign({}, agent), { skills: (skills !== null && skills !== void 0 ? skills : []).map((s) => {
            var _a;
            return (Object.assign(Object.assign({}, s), { is_primary: (_a = primaryMap.get(s.id)) !== null && _a !== void 0 ? _a : false }));
        }) });
}
export async function touchAgentUsage(agentId, tenantId) {
    const supabase = clientFor(tenantId);
    await supabase
        .from("ziro_agents")
        .update({ last_used_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", agentId);
}
