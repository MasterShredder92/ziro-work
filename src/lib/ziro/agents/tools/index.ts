/**
 * ZiroWork Unified Tool Registry
 * 
 * Maps tool names to their implementations.
 * All agents pull their tools from this registry.
 * 
 * This is the "Hands" of the ZiroWork Agentic System.
 */

import { RUBY_TOOLS } from "./ruby-tools";
import { SID_TOOLS } from "./sid-tools";
import { VADER_TOOLS } from "./vader-tools";
import { RAVEN_TOOLS } from "./raven-tools";

export const TOOL_REGISTRY: Record<string, (...args: any[]) => Promise<any>> = {
  // Ruby — Scheduling
  read_schedule: RUBY_TOOLS.read_schedule,
  check_conflicts: RUBY_TOOLS.check_conflicts,
  suggest_slot: RUBY_TOOLS.suggest_slot,
  move_lesson: RUBY_TOOLS.move_lesson,
  add_lesson: RUBY_TOOLS.add_lesson,

  // Sid — Student & Instructor Data
  read_student: SID_TOOLS.read_student,
  update_student_bio: SID_TOOLS.update_student_bio,
  read_instructor: SID_TOOLS.read_instructor,
  update_instructor_info: SID_TOOLS.update_instructor_info,
  get_lesson_history: SID_TOOLS.get_lesson_history,

  // Vader — Financial
  read_invoices: VADER_TOOLS.read_invoices,
  create_invoice: VADER_TOOLS.create_invoice,
  check_balance: VADER_TOOLS.check_balance,
  generate_report: VADER_TOOLS.generate_report,

  // Raven — Analytics
  analyze_trends: RAVEN_TOOLS.analyze_trends,
  predict_churn: RAVEN_TOOLS.predict_churn,
  generate_insights: RAVEN_TOOLS.generate_insights,
};

/**
 * Execute a tool by name with the given input
 * This is called by the orchestrator when an agent wants to use a tool
 */
export async function executeTool(
  toolName: string,
  input: Record<string, any>
): Promise<{ success: boolean; result?: any; error?: string }> {
  const tool = TOOL_REGISTRY[toolName];

  if (!tool) {
    return { success: false, error: `Tool "${toolName}" not found in registry` };
  }

  try {
    const result = await tool(input);
    return { success: true, result };
  } catch (error: any) {
    console.error(`[Tool Execution Error] ${toolName}:`, error);
    return { success: false, error: error.message || "Tool execution failed" };
  }
}

export { RUBY_TOOLS, SID_TOOLS, VADER_TOOLS, RAVEN_TOOLS };
