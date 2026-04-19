import { getServiceClient } from "@/lib/supabase";
import { classifyTask } from "./classifyTask";
import { loadTemplatesWithSkills, selectBestTemplate } from "./selectTemplate";
import { selectSkills } from "./selectSkills";
import { selectRuntime } from "./selectRuntime";
import {
  composeSystemPrompt,
  composeSpecialistExecutionPrompt,
  estimateTokens,
} from "./composeSystemPrompt";
import { proposeSkill } from "./proposeSkill";
import {
  parseStarRoutingRules,
  resolveStarControlAgent,
  type StarControlRow,
  type ZirorbRow,
} from "./starRouting";
import type {
  RouteResult,
  RouteDecision,
  RouteFallback,
  TemplateProposal,
  Runtime,
  AgentMode,
  ClassifiedTask,
  Skill,
  StarControlDelegation,
} from "@/types/orchestrator";

export interface RoutedTask {
  route: RouteResult;
  composedPrompt: string;
  estimatedTokens: number;
  agentId: string | null;
  agentMode: AgentMode;
  classification: ClassifiedTask;
}

const BUSINESS_CONTEXT = "music_school";

async function loadAgentSkills(agentId: string): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("agent_skills")
    .select("skill_id")
    .eq("agent_id", agentId)
    .order("priority", { ascending: true });
  return (data || []).map((r: { skill_id: string }) => r.skill_id);
}

async function fetchSkillsByIds(ids: string[]): Promise<Skill[]> {
  if (ids.length === 0) return [];
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("skills")
    .select("*")
    .in("id", ids)
    .eq("is_active", true)
    .eq("approval_status", "approved")
    .eq("business_context", BUSINESS_CONTEXT);
  return (data || []) as Skill[];
}

async function tryResolveStarControlDelegation(
  classification: ClassifiedTask,
  description: string
): Promise<RoutedTask | null> {
  const supabase = getServiceClient();

  const { data: starCfg, error: cfgErr } = await supabase
    .from("star_config")
    .select("routing_rules, delegation_mode, approved_agent_ids")
    .eq("business_context", BUSINESS_CONTEXT)
    .maybeSingle();

  if (cfgErr) {
    console.warn("[ROUTE] star_config read failed, skipping Star Control delegation:", cfgErr.message);
    return null;
  }
  if (!starCfg) {
    return null;
  }

  const delegationMode = String(starCfg.delegation_mode || "auto");
  const approvedAgentIds = (starCfg.approved_agent_ids || []) as string[];
  const rules = parseStarRoutingRules(starCfg.routing_rules);

  const { data: zRows, error: zErr } = await supabase.from("zirorbs").select("id, slug, is_active");
  if (zErr) {
    console.warn("[ROUTE] zirorbs read failed:", zErr.message);
    return null;
  }
  const zirorbs = (zRows || []) as ZirorbRow[];

  const { data: agentRows, error: aErr } = await supabase
    .from("agents")
    .select("id, slug, zirorb_id, zirorb_sort, name, status, is_archived, is_visible_in_ui, mode")
    .eq("business_context", BUSINESS_CONTEXT)
    .neq("slug", "star");

  if (aErr) {
    console.warn("[ROUTE] agents read failed:", aErr.message);
    return null;
  }

  const agents = (agentRows || []) as StarControlRow[];
  const resolved = resolveStarControlAgent({
    taskType: classification.task_type,
    rules,
    zirorbs,
    agents,
    delegationMode,
    approvedAgentIds,
  });

  if (!resolved) {
    console.log(
      `[ROUTE] Star Control: no specialist for type "${classification.task_type}" (delegation=${delegationMode}).`
    );
    return null;
  }

  const { data: agentRow, error: oneErr } = await supabase
    .from("agents")
    .select("id, name, role, instructions, system_prompt, template_id, mode")
    .eq("id", resolved.agentId)
    .single();

  if (oneErr || !agentRow) {
    console.warn("[ROUTE] Star Control resolved id but agent row missing:", oneErr?.message);
    return null;
  }

  const skillIds = await loadAgentSkills(resolved.agentId);
  const skills = await fetchSkillsByIds(skillIds);
  const composedPrompt = composeSpecialistExecutionPrompt(
    {
      name: agentRow.name,
      role: agentRow.role,
      instructions: agentRow.instructions,
      system_prompt: agentRow.system_prompt,
    },
    skills,
    description
  );

  const runtime: Runtime = classification.suggested_runtime;
  const route: StarControlDelegation = {
    source: "star_control",
    agent_id: resolved.agentId,
    task_type: classification.task_type,
    skills,
    runtime,
    reason: `${resolved.reason} [classification keywords: ${classification.keywords.slice(0, 6).join(", ")}]`,
  };

  console.log(`[ROUTE] Star Control delegation → agent ${resolved.agentId} (${resolved.reason})`);

  return {
    route,
    composedPrompt,
    estimatedTokens: estimateTokens(composedPrompt),
    agentId: resolved.agentId,
    agentMode: (agentRow.mode as AgentMode) || "persistent",
    classification,
  };
}

// Find or create an agent for this routed task
async function resolveAgent(
  route: RouteDecision,
  composedPrompt: string
): Promise<{ agentId: string; mode: AgentMode; agentSkillIds: string[] }> {
  const supabase = getServiceClient();

  // Prefer existing active persistent agent that uses this template
  if (route.template) {
    const { data: existing } = await supabase
      .from("agents")
      .select("id, mode, current_load")
      .eq("template_id", route.template.id)
      .eq("mode", "persistent")
      .eq("is_archived", false)
      .eq("business_context", BUSINESS_CONTEXT)
      .in("status", ["deployed", "build_now", "active"])
      .order("current_load", { ascending: true })
      .limit(1);

    if (existing && existing.length > 0) {
      // Update system prompt on the existing agent
      await supabase
        .from("agents")
        .update({
          system_prompt: composedPrompt,
          current_load: (existing[0].current_load || 0) + 1,
          last_heartbeat_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);

      const skillIds = await loadAgentSkills(existing[0].id);
      return { agentId: existing[0].id, mode: "persistent", agentSkillIds: skillIds };
    }
  }

  // No matching persistent agent — create ephemeral
  const { data: newAgent, error } = await supabase
    .from("agents")
    .insert({
      slug: `ephemeral-${Date.now()}`,
      name: route.template?.name || "Ephemeral Agent",
      role: route.template?.description || "Task executor",
      status: "active",
      system_prompt: composedPrompt,
      color: "#888888",
      position_x: 0,
      position_y: 0,
      template_id: route.template?.id || null,
      mode: "ephemeral" as AgentMode,
      current_load: 1,
      created_by: "star",
      reason_created: route.reason,
      last_heartbeat_at: new Date().toISOString(),
      is_visible_in_ui: true,
      is_archived: false,
      business_context: BUSINESS_CONTEXT,
    })
    .select("id")
    .single();

  if (error || !newAgent) {
    console.error(`[ROUTE] Failed to create ephemeral agent: ${error?.message}`);
    // Fallback to STAR agent
    const { data: star } = await supabase.from("agents").select("id").eq("slug", "star").single();
    return { agentId: star?.id || "", mode: "ephemeral", agentSkillIds: [] };
  }

  return { agentId: newAgent.id, mode: "ephemeral", agentSkillIds: [] };
}

// Main routing entry point
export async function routeTask(title: string, description: string): Promise<RoutedTask> {
  const classification = classifyTask(title, description);

  const starDelegated = await tryResolveStarControlDelegation(classification, description);
  if (starDelegated) {
    return starDelegated;
  }

  const templates = await loadTemplatesWithSkills();

  // No templates — pure fallback
  if (templates.length === 0) {
    const fallback: RouteFallback = {
      template: null,
      skills: [],
      runtime: classification.suggested_runtime,
      score: 0,
      reason: "No active templates found. Using default fallback behavior.",
    };
    const composedPrompt = composeSystemPrompt(null, [], description);
    return {
      route: fallback,
      composedPrompt,
      estimatedTokens: estimateTokens(composedPrompt),
      agentId: null,
      agentMode: "ephemeral",
      classification,
    };
  }

  const best = selectBestTemplate(templates, classification);

  // No template scored high enough — return proposal
  if (!best) {
    const proposal: TemplateProposal = {
      proposed: true,
      task_type: classification.task_type,
      suggested_name: `${classification.task_type}-specialist`,
      suggested_skills: classification.keywords.slice(0, 4),
      reason: `No template scored above threshold for task type "${classification.task_type}". Consider creating a new template.`,
    };
    const composedPrompt = composeSystemPrompt(null, [], description);
    return {
      route: proposal,
      composedPrompt,
      estimatedTokens: estimateTokens(composedPrompt),
      agentId: null,
      agentMode: "ephemeral",
      classification,
    };
  }

  // Route matched — select skills + runtime + compose prompt
  const runtime: Runtime = selectRuntime(
    classification.suggested_runtime,
    best.template.supported_runtimes
  );
  const skills = selectSkills(best.template.skills, runtime, classification.keywords);
  const composedPrompt = composeSystemPrompt(best.template, skills, description);

  // Detect skill gaps: keywords that matched classification but no skill tag covers them
  const allSkillTags = skills.flatMap((s) => s.tags || []);
  const uncoveredKeywords = classification.keywords.filter((kw) => !allSkillTags.includes(kw));
  if (uncoveredKeywords.length >= 2 && best.score < 60) {
    // Propose a skill for the gap (non-blocking, runs in background)
    const gapKey = `${classification.task_type}-${uncoveredKeywords[0]}`.replace(/\s+/g, "-").toLowerCase();
    proposeSkill({
      key: gapKey,
      name: `${uncoveredKeywords[0]} ${classification.task_type}`.replace(/\b\w/g, (c) => c.toUpperCase()),
      description: `Handles ${uncoveredKeywords.join(", ")} tasks within ${classification.task_type} domain. Auto-proposed by STAR routing.`,
      category: classification.task_type === "code" || classification.task_type === "ui" ? "engineering" : "operations",
      system_prompt_fragment: `You handle tasks related to: ${uncoveredKeywords.join(", ")}. Follow standard operating procedures for ${classification.task_type} work.`,
      preferred_runtime: runtime,
      tags: uncoveredKeywords,
      reason: `Routing scored ${best.score} for "${title}" — keywords [${uncoveredKeywords.join(", ")}] had no matching skill tags.`,
    }).catch((err) => console.error("[ROUTE] Skill proposal failed:", err));
  }

  const route: RouteDecision = {
    template: best.template,
    skills,
    runtime,
    score: best.score,
    reason: `Matched "${best.template.name}" (score: ${best.score}, type: ${classification.task_type}, runtime: ${runtime}).`,
  };

  // Resolve agent (find existing or create ephemeral)
  const { agentId, mode, agentSkillIds } = await resolveAgent(route, composedPrompt);

  // Merge agent-attached skills into the route (deduplicated with template skills)
  if (agentSkillIds.length > 0) {
    const existingIds = new Set(skills.map((s) => s.id));
    const newIds = agentSkillIds.filter((id) => !existingIds.has(id));
    if (newIds.length > 0) {
      const supabase = getServiceClient();
      const { data: agentSkills } = await supabase
        .from("skills")
        .select("*")
        .in("id", newIds)
        .eq("is_active", true)
        .eq("approval_status", "approved");
      if (agentSkills && agentSkills.length > 0) {
        route.skills = [...skills, ...agentSkills];
        // Recompose prompt with merged skill set
        const mergedPrompt = composeSystemPrompt(best.template, route.skills, description);
        console.log(`[ROUTE] Merged ${agentSkills.length} agent-attached skills for agent ${agentId}`);
        return {
          route,
          composedPrompt: mergedPrompt,
          estimatedTokens: estimateTokens(mergedPrompt),
          agentId,
          agentMode: mode,
          classification,
        };
      }
    }
  }

  console.log(
    `[ROUTE] ${title} → template="${best.template.slug}" runtime=${runtime} score=${best.score} agent=${agentId} mode=${mode}`
  );

  return {
    route,
    composedPrompt,
    estimatedTokens: estimateTokens(composedPrompt),
    agentId,
    agentMode: mode,
    classification,
  };
}
