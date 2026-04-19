import { getServiceClient } from "@/lib/supabase";
import {
  getSkillPack,
  getSkillPackSkill,
  listSkillPackSkills,
  resolveSkillPackSkill,
  skillPacks,
  type SkillPack,
  type SkillPackAgentSlug,
  type SkillPackHandlerArgs,
  type SkillPackSkill,
} from "@/lib/ziro/skills";

export type ResolvedSkill = {
  id: string;
  slug: string | null;
  key: string | null;
  name: string;
  description: string | null;
  category: string | null;
  systemPromptFragment: string | null;
  promptFragment: string | null;
  allowedTools: unknown;
  inputSchema: unknown;
  outputSchema: unknown;
  preferredRuntime: string | null;
  runtime: string | null;
  tags: string[];
  isActive: boolean;
  approvalStatus: string | null;
  businessContext: string | null;
};

export type AgentSkillLink = {
  skillId: string;
  agentId: string;
  priority: number;
};

type SkillRow = {
  id: string;
  slug: string | null;
  key: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  system_prompt_fragment: string | null;
  prompt_fragment: string | null;
  allowed_tools: unknown;
  input_schema: unknown;
  output_schema: unknown;
  preferred_runtime: string | null;
  runtime: string | null;
  tags: string[] | null;
  is_active: boolean | null;
  approval_status: string | null;
  business_context: string | null;
};

const SKILL_SELECT =
  "id, slug, key, name, description, category, system_prompt_fragment, prompt_fragment, allowed_tools, input_schema, output_schema, preferred_runtime, runtime, tags, is_active, approval_status, business_context";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function rowToResolved(row: SkillRow): ResolvedSkill {
  return {
    id: row.id,
    slug: row.slug,
    key: row.key,
    name: row.name ?? row.slug ?? row.key ?? row.id,
    description: row.description,
    category: row.category,
    systemPromptFragment: row.system_prompt_fragment,
    promptFragment: row.prompt_fragment,
    allowedTools: row.allowed_tools ?? null,
    inputSchema: row.input_schema ?? null,
    outputSchema: row.output_schema ?? null,
    preferredRuntime: row.preferred_runtime,
    runtime: row.runtime,
    tags: Array.isArray(row.tags) ? row.tags : [],
    isActive: !!row.is_active,
    approvalStatus: row.approval_status,
    businessContext: row.business_context,
  };
}

async function loadAgentSkills(agentId: string): Promise<AgentSkillLink[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("agent_skills")
    .select("agent_id, skill_id, priority")
    .eq("agent_id", agentId)
    .order("priority", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(
    (r: { agent_id: string; skill_id: string; priority: number }) => ({
      agentId: r.agent_id,
      skillId: r.skill_id,
      priority: r.priority,
    }),
  );
}

async function fetchSkillsByIds(
  ids: string[],
  opts: { businessContext?: string | null; activeOnly?: boolean } = {},
): Promise<ResolvedSkill[]> {
  if (ids.length === 0) return [];
  const supabase = getServiceClient();
  let query = supabase.from("skills").select(SKILL_SELECT).in("id", ids);
  if (opts.activeOnly !== false) query = query.eq("is_active", true);
  if (opts.businessContext)
    query = query.eq("business_context", opts.businessContext);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => rowToResolved(r as SkillRow));
}

export type ResolveSkillOptions = {
  businessContext?: string | null;
  activeOnly?: boolean;
};

export async function resolveSkill(
  slugOrKeyOrId: string,
  opts: ResolveSkillOptions = {},
): Promise<ResolvedSkill | null> {
  if (!slugOrKeyOrId) return null;

  const supabase = getServiceClient();
  const activeOnly = opts.activeOnly !== false;

  if (isUuid(slugOrKeyOrId)) {
    let query = supabase
      .from("skills")
      .select(SKILL_SELECT)
      .eq("id", slugOrKeyOrId)
      .limit(1);
    if (activeOnly) query = query.eq("is_active", true);
    if (opts.businessContext)
      query = query.eq("business_context", opts.businessContext);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? rowToResolved(data as SkillRow) : null;
  }

  for (const column of ["slug", "key"] as const) {
    let query = supabase
      .from("skills")
      .select(SKILL_SELECT)
      .eq(column, slugOrKeyOrId)
      .limit(1);
    if (activeOnly) query = query.eq("is_active", true);
    if (opts.businessContext)
      query = query.eq("business_context", opts.businessContext);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data) return rowToResolved(data as SkillRow);
  }

  return null;
}

export type ListSkillsForAgentOptions = {
  businessContext?: string | null;
  activeOnly?: boolean;
};

export async function listSkillsForAgent(
  agentId: string,
  opts: ListSkillsForAgentOptions = {},
): Promise<ResolvedSkill[]> {
  if (!agentId) return [];
  const links = await loadAgentSkills(agentId);
  if (links.length === 0) return [];

  const orderedIds = links.map((l) => l.skillId);
  const skills = await fetchSkillsByIds(orderedIds, {
    businessContext: opts.businessContext,
    activeOnly: opts.activeOnly,
  });

  const order = new Map<string, number>();
  orderedIds.forEach((id, idx) => order.set(id, idx));
  return skills.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
}

export type SkillPackMatch = {
  agent: string;
  key: string;
  definition: SkillPackSkill;
};

export type ResolveSkillOrPackResult =
  | { source: "db"; skill: ResolvedSkill }
  | { source: "pack"; match: SkillPackMatch };

export async function resolveSkillOrPack(
  slugOrKeyOrId: string,
  opts: ResolveSkillOptions = {},
): Promise<ResolveSkillOrPackResult | null> {
  if (!slugOrKeyOrId) return null;
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

export function findSkillInPacks(slugOrKey: string): SkillPackMatch | null {
  const hit = resolveSkillPackSkill(slugOrKey);
  if (!hit) return null;
  return { agent: hit.agentSlug, key: hit.skillKey, definition: hit.skill };
}

export type SkillPackSkillEntry = {
  agentSlug: string;
  skillKey: string;
  title: string;
  description: string;
  skill: SkillPackSkill;
};

function packEntryToResolved(
  agentSlug: string,
  skillKey: string,
  skill: SkillPackSkill,
): ResolvedSkill {
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

export function listSkillPacks(): SkillPackSkillEntry[] {
  return listSkillPackSkills().map(({ agentSlug, skillKey, skill }) => ({
    agentSlug,
    skillKey,
    title: skill.title,
    description: skill.description,
    skill,
  }));
}

export function listResolvedSkillPackSkills(): ResolvedSkill[] {
  return listSkillPackSkills().map(({ agentSlug, skillKey, skill }) =>
    packEntryToResolved(agentSlug, skillKey, skill),
  );
}

export function resolvePackSkill(
  identifier: string,
): SkillPackSkillEntry | null {
  const resolved = resolveSkillPackSkill(identifier);
  if (!resolved) return null;
  return {
    agentSlug: resolved.agentSlug,
    skillKey: resolved.skillKey,
    title: resolved.skill.title,
    description: resolved.skill.description,
    skill: resolved.skill,
  };
}

export function getSkillPackForAgent(
  agentSlug: string,
): SkillPack | null {
  return getSkillPack(agentSlug);
}

export async function runSkillPack(
  identifier: string,
  args: SkillPackHandlerArgs,
): Promise<unknown> {
  const entry = resolveSkillPackSkill(identifier);
  if (!entry) {
    throw new Error(`runSkillPack: unknown skill pack identifier '${identifier}'`);
  }
  return entry.skill.handler(args);
}

export function getSkillPackSkillDirect(
  agentSlug: string,
  skillKey: string,
): SkillPackSkill | null {
  return getSkillPackSkill(agentSlug, skillKey);
}

export type ListSkillsForAgentWithPackOptions = ListSkillsForAgentOptions & {
  includePack?: boolean;
};

export async function listSkillsForAgentWithPack(
  agentId: string,
  agentSlug: string | null,
  opts: ListSkillsForAgentWithPackOptions = {},
): Promise<ResolvedSkill[]> {
  const dbSkills = await listSkillsForAgent(agentId, {
    businessContext: opts.businessContext,
    activeOnly: opts.activeOnly,
  });
  if (opts.includePack === false || !agentSlug) return dbSkills;
  const pack = getSkillPack(agentSlug);
  if (!pack) return dbSkills;
  const packSkills = Object.entries(pack).map(([key, skill]) =>
    packEntryToResolved(agentSlug, key, skill),
  );
  const existingIds = new Set(dbSkills.map((s) => s.id));
  const merged = [...dbSkills];
  for (const ps of packSkills) {
    if (!existingIds.has(ps.id)) merged.push(ps);
  }
  return merged;
}

export async function resolveSkillFromDbOrPack(
  slugOrKeyOrId: string,
  opts: ResolveSkillOptions = {},
): Promise<ResolvedSkill | null> {
  const fromDb = await resolveSkill(slugOrKeyOrId, opts);
  if (fromDb) return fromDb;
  const packHit = resolveSkillPackSkill(slugOrKeyOrId);
  if (!packHit) return null;
  return packEntryToResolved(packHit.agentSlug, packHit.skillKey, packHit.skill);
}

export { skillPacks };
export type {
  SkillPack,
  SkillPackAgentSlug,
  SkillPackHandlerArgs,
  SkillPackSkill,
};
