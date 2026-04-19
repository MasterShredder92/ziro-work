import { clientFor } from "@data/_client";
import type { ZiroSkill, ZiroAgentSkill } from "@/lib/types/entities";

export async function listSkills(
  tenantId: string,
  opts?: { activeOnly?: boolean; runtime?: string },
): Promise<ZiroSkill[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from("ziro_skills")
    .select("*")
    .eq("tenant_id", tenantId);
  if (opts?.activeOnly) query = query.eq("is_active", true);
  if (opts?.runtime) query = query.eq("runtime", opts.runtime);

  const { data, error } = await query.order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ZiroSkill[];
}

export async function getSkillById(
  id: string,
  tenantId: string,
): Promise<ZiroSkill | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("ziro_skills")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ZiroSkill | null;
}

export async function getSkillByKey(
  key: string,
  tenantId: string,
): Promise<ZiroSkill | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("ziro_skills")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ZiroSkill | null;
}

export async function resolveSkill(
  identifier: { id?: string; key?: string },
  tenantId: string,
): Promise<ZiroSkill | null> {
  if (identifier.id) return getSkillById(identifier.id, tenantId);
  if (identifier.key) return getSkillByKey(identifier.key, tenantId);
  return null;
}

export async function listSkillsForAgent(
  agentId: string,
  tenantId: string,
): Promise<Array<ZiroSkill & { is_primary: boolean }>> {
  const supabase = clientFor(tenantId);
  const { data: links, error: linkErr } = await supabase
    .from("ziro_agent_skills")
    .select("skill_id, is_primary")
    .eq("tenant_id", tenantId)
    .eq("agent_id", agentId);
  if (linkErr) throw linkErr;

  const rows = (links ?? []) as Array<Pick<ZiroAgentSkill, "skill_id" | "is_primary">>;
  if (rows.length === 0) return [];

  const { data: skills, error: skillErr } = await supabase
    .from("ziro_skills")
    .select("*")
    .eq("tenant_id", tenantId)
    .in(
      "id",
      rows.map((r) => r.skill_id),
    );
  if (skillErr) throw skillErr;

  const primaryMap = new Map<string, boolean>(
    rows.map((r) => [r.skill_id, r.is_primary]),
  );

  return (skills ?? []).map((s: ZiroSkill) => ({
    ...s,
    is_primary: primaryMap.get(s.id) ?? false,
  }));
}

export async function attachSkillToAgent(
  agentId: string,
  skillId: string,
  tenantId: string,
  isPrimary = false,
): Promise<ZiroAgentSkill> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("ziro_agent_skills")
    .upsert(
      {
        agent_id: agentId,
        skill_id: skillId,
        tenant_id: tenantId,
        is_primary: isPrimary,
      },
      { onConflict: "agent_id,skill_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as ZiroAgentSkill;
}

export async function detachSkillFromAgent(
  agentId: string,
  skillId: string,
  tenantId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from("ziro_agent_skills")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("agent_id", agentId)
    .eq("skill_id", skillId);
  if (error) throw error;
}

export async function touchSkillUsage(
  skillId: string,
  tenantId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("ziro_skills")
    .select("use_count")
    .eq("tenant_id", tenantId)
    .eq("id", skillId)
    .maybeSingle();
  const next = ((data?.use_count as number | undefined) ?? 0) + 1;
  await supabase
    .from("ziro_skills")
    .update({ last_used_at: now, use_count: next, updated_at: now })
    .eq("tenant_id", tenantId)
    .eq("id", skillId);
}
