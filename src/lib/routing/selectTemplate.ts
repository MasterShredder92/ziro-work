import { getServiceClient } from "@/lib/supabase";
import type { AgentTemplate, Skill, ClassifiedTask } from "@/types/orchestrator";

export interface TemplateWithSkills extends AgentTemplate {
  skills: Skill[];
}

// Load all active music-school templates with their linked skills from DB (never hardcoded IDs)
export async function loadTemplatesWithSkills(): Promise<TemplateWithSkills[]> {
  const supabase = getServiceClient();

  const { data: templates } = await supabase
    .from("agent_templates")
    .select("*")
    .eq("is_active", true)
    .eq("business_context", "music_school");

  if (!templates || templates.length === 0) return [];

  const { data: links } = await supabase
    .from("agent_template_skills")
    .select("agent_template_id, skill_id, priority")
    .in("agent_template_id", templates.map((t: AgentTemplate) => t.id))
    .order("priority", { ascending: true });

  const skillIds = [...new Set((links || []).map((l: { skill_id: string }) => l.skill_id))];
  const { data: skills } = skillIds.length > 0
    ? await supabase.from("skills").select("*").in("id", skillIds).eq("is_active", true)
    : { data: [] as Skill[] };

  const skillMap = new Map((skills || []).map((s: Skill) => [s.id, s]));

  return templates.map((t: AgentTemplate) => ({
    ...t,
    skills: (links || [])
      .filter((l: { agent_template_id: string }) => l.agent_template_id === t.id)
      .map((l: { skill_id: string }) => skillMap.get(l.skill_id))
      .filter(Boolean) as Skill[],
  }));
}

// Score a template against a classified task
function scoreTemplate(template: TemplateWithSkills, classified: ClassifiedTask): number {
  let score = 0;

  // Task type match — primary signal (0-40)
  const taskTypes = template.task_types || [];
  if (taskTypes.includes(classified.task_type)) {
    score += 40;
  }

  // Keyword overlap with skill tags (0-20)
  const allTags = template.skills.flatMap((s) => s.tags || []);
  for (const kw of classified.keywords) {
    if (allTags.includes(kw)) score += 4;
  }
  score = Math.min(score, 60);

  // Runtime fit (0-20)
  const runtimes = template.supported_runtimes || [];
  if (runtimes.includes(classified.suggested_runtime)) {
    score += 20;
  }

  // Skill count penalty if overloaded
  if (template.skills.length > (template.max_skills || 4)) {
    score -= 15;
  }

  return Math.min(score, 100);
}

// Select best template for a classified task
export function selectBestTemplate(
  templates: TemplateWithSkills[],
  classified: ClassifiedTask
): { template: TemplateWithSkills; score: number } | null {
  if (templates.length === 0) return null;

  const scored = templates
    .map((t) => ({ template: t, score: scoreTemplate(t, classified) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best.score < 20) return null;

  return best;
}
