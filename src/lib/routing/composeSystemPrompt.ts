import type { AgentTemplate, Skill } from "@/types/orchestrator";

const STAR_BASE_PROMPT = `You are STAR — the Strategic Task & Action Router for the Ziro Work command center.

You are the orchestrator. You do not execute tasks yourself. You classify, route, compose, and review.

Core responsibilities:
1. Understand what the user is asking for
2. Break it into actionable tasks
3. Route each task to the right agent template with the right skills
4. Review the results and report back

Rules:
- Be precise and surgical in task descriptions
- Always specify exact file paths, table names, and column names
- Never leave ambiguity — the worker agent cannot ask questions
- Every task must be self-contained and executable
- Always include verification steps in task descriptions

Codebase: Lessonpreneur lives at D:\\music-school-os\\app
Database: Supabase project dhsyxyhtoadrqfrlmsqe
Tenant ID: 00000000-0000-0000-0000-000000000001`;

export function composeSystemPrompt(
  template: AgentTemplate | null,
  skills: Skill[],
  taskDescription: string
): string {
  const parts: string[] = [];

  // 1. STAR base prompt
  parts.push(STAR_BASE_PROMPT);

  // 2. Template base prompt
  if (template) {
    parts.push(`\n--- AGENT TEMPLATE: ${template.name} ---`);
    parts.push(template.base_prompt);
  }

  // 3. Skill prompt fragments
  if (skills.length > 0) {
    parts.push(`\n--- SKILLS (${skills.length}) ---`);
    for (const skill of skills) {
      parts.push(`\n[${skill.name}]`);
      parts.push(skill.prompt_fragment);
    }
  }

  // 4. Task-specific constraints
  parts.push(`\n--- TASK ---`);
  parts.push(taskDescription);

  return parts.join("\n");
}

export function estimateTokens(prompt: string): number {
  return Math.ceil(prompt.length / 4);
}
