import { clientFor } from "@data/_client";
import type { ZiroAgent, ZiroAgentSkill, ZiroSkill } from "@/lib/types/entities";

export type AgentResolution = ZiroAgent & {
  skills: Array<ZiroSkill & { is_primary: boolean }>;
};

export async function listAgents(
  tenantId: string,
  opts?: { includeArchived?: boolean; status?: string },
): Promise<ZiroAgent[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from("ziro_agents")
    .select("*")
    .eq("tenant_id", tenantId);

  if (!opts?.includeArchived) query = query.eq("is_archived", false);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ZiroAgent[];
}

export async function getAgentById(
  id: string,
  tenantId: string,
): Promise<ZiroAgent | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("ziro_agents")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ZiroAgent | null;
}

export async function getAgentByName(
  name: string,
  tenantId: string,
): Promise<ZiroAgent | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("ziro_agents")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("name", name)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ZiroAgent | null;
}

export async function resolveAgent(
  identifier: { id?: string; name?: string },
  tenantId: string,
): Promise<AgentResolution | null> {
  const agent = identifier.id
    ? await getAgentById(identifier.id, tenantId)
    : identifier.name
      ? await getAgentByName(identifier.name, tenantId)
      : null;
  if (!agent) return null;

  const supabase = clientFor(tenantId);
  const { data: links, error: linkErr } = await supabase
    .from("ziro_agent_skills")
    .select("skill_id, is_primary")
    .eq("tenant_id", tenantId)
    .eq("agent_id", agent.id);
  if (linkErr) throw linkErr;

  const skillIds = (links ?? []).map(
    (l: Pick<ZiroAgentSkill, "skill_id">) => l.skill_id,
  );
  if (skillIds.length === 0) return { ...agent, skills: [] };

  const { data: skills, error: skillErr } = await supabase
    .from("ziro_skills")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", skillIds);
  if (skillErr) throw skillErr;

  const primaryMap = new Map<string, boolean>(
    (links ?? []).map((l: Pick<ZiroAgentSkill, "skill_id" | "is_primary">) => [
      l.skill_id,
      l.is_primary,
    ]),
  );

  return {
    ...agent,
    skills: (skills ?? []).map((s: ZiroSkill) => ({
      ...s,
      is_primary: primaryMap.get(s.id) ?? false,
    })),
  };
}

export async function touchAgentUsage(
  agentId: string,
  tenantId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  await supabase
    .from("ziro_agents")
    .update({ last_used_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", agentId);
}
