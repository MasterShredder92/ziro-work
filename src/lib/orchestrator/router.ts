import { getServiceClient } from "@/lib/supabase";
import { classifyTask } from "./classifier";
import type {
  AgentTemplate,
  Skill,
  RouteDecision,
  ClassifiedTask,
  ProposeNewTemplate,
  Runtime,
} from "@/types/orchestrator";

interface TemplateWithSkills extends AgentTemplate {
  skills: Skill[];
}

// Load all active templates with their linked skills
async function loadTemplatesWithSkills(): Promise<TemplateWithSkills[]> {
  const supabase = getServiceClient();

  const { data: templates } = await supabase
    .from("agent_templates")
    .select("*")
    .eq("is_active", true);

  if (!templates || templates.length === 0) return [];

  const { data: links } = await supabase
    .from("agent_template_skills")
    .select("template_id, skill_id, priority")
    .in("template_id", templates.map((t) => t.id))
    .order("priority", { ascending: true });

  const skillIds = [...new Set((links || []).map((l) => l.skill_id))];
  const { data: skills } = skillIds.length > 0
    ? await supabase.from("skills").select("*").in("id", skillIds)
    : { data: [] };

  const skillMap = new Map((skills || []).map((s) => [s.id, s]));

  return templates.map((t) => ({
    ...t,
    skills: (links || [])
      .filter((l) => l.template_id === t.id)
      .map((l) => skillMap.get(l.skill_id))
      .filter(Boolean) as Skill[],
  }));
}

// Score a template against a classified task
function scoreTemplate(
  template: TemplateWithSkills,
  classified: ClassifiedTask
): number {
  let score = 0;

  // Task type match (0-40 points)
  const taskTypes = template.task_types || [];
  if (taskTypes.includes(classified.task_type)) {
    score += 40;
  }

  // Keyword overlap with task types (0-20 points)
  for (const kw of classified.keywords) {
    if (taskTypes.some((tt) => tt.includes(kw))) {
      score += 5;
    }
  }
  score = Math.min(score, 60); // cap keyword bonus

  // Runtime fit (0-20 points)
  const runtimes = template.supported_runtimes || [];
  if (runtimes.includes(classified.suggested_runtime)) {
    score += 20;
  }

  // Skill coverage — bonus for relevant skill tags matching keywords (0-20 points)
  const allTags = template.skills.flatMap((s) => s.tags || []);
  for (const kw of classified.keywords) {
    if (allTags.includes(kw)) {
      score += 5;
    }
  }
  score = Math.min(score, 100);

  // Overload penalty — if template has > max_skills linked, penalize
  if (template.skills.length > (template.max_skills || 4)) {
    score -= 20;
  }

  return score;
}

// Main routing function
export async function routeTask(
  title: string,
  description: string
): Promise<RouteDecision | ProposeNewTemplate> {
  const classified = classifyTask(title, description);
  const templates = await loadTemplatesWithSkills();

  if (templates.length === 0) {
    // No templates exist — fallback to default behavior
    return {
      template: null,
      skills: [],
      runtime: classified.suggested_runtime,
      score: 0,
      reason: "No active templates found. Using default behavior.",
    };
  }

  // Score all templates
  const scored = templates
    .map((t) => ({ template: t, score: scoreTemplate(t, classified) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  // If best score is too low, propose a new template instead of auto-creating
  if (best.score < 20) {
    return {
      proposed: true,
      task_type: classified.task_type,
      suggested_name: `${classified.task_type}-specialist`,
      suggested_skills: classified.keywords.slice(0, 4),
      reason: `No template scored above threshold (best: ${best.template.name} at ${best.score}). Task type: ${classified.task_type}.`,
    };
  }

  // Check for overloaded template
  if (best.template.skills.length > (best.template.max_skills || 4)) {
    console.warn(
      `[ROUTER] Template "${best.template.name}" is overloaded: ${best.template.skills.length} skills > max ${best.template.max_skills}`
    );
  }

  // Select runtime — prefer task's suggested runtime if template supports it
  const runtime: Runtime = (best.template.supported_runtimes || []).includes(
    classified.suggested_runtime
  )
    ? classified.suggested_runtime
    : (best.template.supported_runtimes?.[0] as Runtime) || "claude_code";

  // Select skills — only those relevant to the task keywords + runtime
  const relevantSkills = best.template.skills.filter(
    (s) => s.runtime === runtime || s.runtime === "claude_code"
  );

  return {
    template: best.template,
    skills: relevantSkills,
    runtime,
    score: best.score,
    reason: `Matched template "${best.template.name}" (score: ${best.score}, type: ${classified.task_type}).`,
  };
}
