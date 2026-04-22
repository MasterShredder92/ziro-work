/**
 * ZiroWork Unified Tool Registry — ORCHESTRATOR MODE
 * 
 * Maps tool names to their implementations.
 */

import { RUBY_TOOLS } from "./ruby-tools";
import { SID_TOOLS } from "./sid-tools";
import { VADER_TOOLS } from "./vader-tools";
import { RAVEN_TOOLS } from "./raven-tools";

export const TOOL_REGISTRY: Record<string, (...args: any[]) => Promise<any>> = {
  // Ruby — Scheduling & Orchestration
  read_schedule: RUBY_TOOLS.read_schedule,
  move_student: (RUBY_TOOLS as any).move_student,
  handle_teacher_callout: (RUBY_TOOLS as any).handle_teacher_callout,
  find_booking_gaps: (RUBY_TOOLS as any).find_booking_gaps,

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
