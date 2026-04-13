import { getServiceClient } from "@/lib/supabase";
import { classifyTask } from "./classifyTask";
import { loadTemplatesWithSkills, selectBestTemplate } from "./selectTemplate";
import { selectSkills } from "./selectSkills";
import { selectRuntime } from "./selectRuntime";
import { composeSystemPrompt, estimateTokens } from "./composeSystemPrompt";
import type {
  RouteResult,
  RouteDecision,
  RouteFallback,
  TemplateProposal,
  Runtime,
  AgentMode,
} from "@/types/orchestrator";

export interface RoutedTask {
  route: RouteResult;
  composedPrompt: string;
  estimatedTokens: number;
  agentId: string | null;
  agentMode: AgentMode;
}

// Find or create an agent for this routed task
async function resolveAgent(
  route: RouteDecision,
  composedPrompt: string,
  taskTitle: string
): Promise<{ agentId: string; mode: AgentMode }> {
  const supabase = getServiceClient();

  // Prefer existing active persistent agent that uses this template
  if (route.template) {
    const { data: existing } = await supabase
      .from("agents")
      .select("id, mode, current_load")
      .eq("template_id", route.template.id)
      .eq("mode", "persistent")
      .eq("is_archived", false)
      .eq("business_context", "music_school")
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

      return { agentId: existing[0].id, mode: "persistent" };
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
      business_context: "music_school",
    })
    .select("id")
    .single();

  if (error || !newAgent) {
    console.error(`[ROUTE] Failed to create ephemeral agent: ${error?.message}`);
    // Fallback to STAR agent
    const { data: star } = await supabase
      .from("agents")
      .select("id")
      .eq("slug", "star")
      .single();
    return { agentId: star?.id || "", mode: "ephemeral" };
  }

  return { agentId: newAgent.id, mode: "ephemeral" };
}

// Main routing entry point
export async function routeTask(
  title: string,
  description: string
): Promise<RoutedTask> {
  const classified = classifyTask(title, description);
  const templates = await loadTemplatesWithSkills();

  // No templates — pure fallback
  if (templates.length === 0) {
    const fallback: RouteFallback = {
      template: null,
      skills: [],
      runtime: classified.suggested_runtime,
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
    };
  }

  const best = selectBestTemplate(templates, classified);

  // No template scored high enough — return proposal
  if (!best) {
    const proposal: TemplateProposal = {
      proposed: true,
      task_type: classified.task_type,
      suggested_name: `${classified.task_type}-specialist`,
      suggested_skills: classified.keywords.slice(0, 4),
      reason: `No template scored above threshold for task type "${classified.task_type}". Consider creating a new template.`,
    };
    const composedPrompt = composeSystemPrompt(null, [], description);
    return {
      route: proposal,
      composedPrompt,
      estimatedTokens: estimateTokens(composedPrompt),
      agentId: null,
      agentMode: "ephemeral",
    };
  }

  // Route matched — select skills + runtime + compose prompt
  const runtime: Runtime = selectRuntime(
    classified.suggested_runtime,
    best.template.supported_runtimes
  );
  const skills = selectSkills(best.template.skills, runtime, classified.keywords);
  const composedPrompt = composeSystemPrompt(best.template, skills, description);

  const route: RouteDecision = {
    template: best.template,
    skills,
    runtime,
    score: best.score,
    reason: `Matched "${best.template.name}" (score: ${best.score}, type: ${classified.task_type}, runtime: ${runtime}).`,
  };

  // Resolve agent (find existing or create ephemeral)
  const { agentId, mode } = await resolveAgent(route, composedPrompt, title);

  console.log(
    `[ROUTE] ${title} → template="${best.template.slug}" runtime=${runtime} score=${best.score} agent=${agentId} mode=${mode}`
  );

  return {
    route,
    composedPrompt,
    estimatedTokens: estimateTokens(composedPrompt),
    agentId,
    agentMode: mode,
  };
}
