/**
 * ZiroWork Unified Tool Registry — THE SOVEREIGN SYSTEM
 * * Maps tool names to their implementations across all agents.
 */

import { RUBY_TOOLS } from "./ruby-tools";
import { SID_TOOLS } from "./sid-tools";
import { VADER_TOOLS } from "./vader-tools";
import { RAVEN_TOOLS } from "./raven-tools";
import { ZIRO_TOOLS } from "./ziro-tools";

export const TOOL_REGISTRY: Record<string, (...args: any[]) => Promise<any>> = {
  // Ziro — Director/CEO (Orchestration)
  delegate_to_agent: (ZIRO_TOOLS as any)?.delegate_to_agent,
  get_global_state: (ZIRO_TOOLS as any)?.get_global_state,

  // Ruby — Scheduling & Orchestration
  read_schedule: RUBY_TOOLS.read_schedule,
  move_student: RUBY_TOOLS.move_student,
  handle_teacher_callout: RUBY_TOOLS.handle_teacher_callout,
  find_booking_gaps: RUBY_TOOLS.find_booking_gaps,

  // Sid — Student & Instructor Data
  read_student: (SID_TOOLS as any)?.read_student,
  update_student_bio: (SID_TOOLS as any)?.update_student_bio,
  read_instructor: (SID_TOOLS as any)?.read_instructor,
  update_instructor_info: (SID_TOOLS as any)?.update_instructor_info,
  get_lesson_history: (SID_TOOLS as any)?.get_lesson_history,

  // Vader — Financial
  read_invoices: (VADER_TOOLS as any)?.read_invoices,
  create_invoice: (VADER_TOOLS as any)?.create_invoice,
  check_balance: (VADER_TOOLS as any)?.check_balance,
  generate_report: (VADER_TOOLS as any)?.generate_report,

  // Raven — Analytics & Communication
  analyze_trends: (RAVEN_TOOLS as any)?.analyze_trends,
  predict_churn: (RAVEN_TOOLS as any)?.predict_churn,
  generate_insights: (RAVEN_TOOLS as any)?.generate_insights,
  send_sms: (RAVEN_TOOLS as any)?.send_sms,
  send_email: (RAVEN_TOOLS as any)?.send_email,
};

export async function executeTool(
  toolName: string,
  input: Record<string, any>
): Promise<{ success: boolean; result?: any; error?: string }> {
  const tool = TOOL_REGISTRY[toolName];

  if (!tool) {
    console.error(`[Tool Execution Error] Tool "${toolName}" not found in registry`);
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

export { RUBY_TOOLS, SID_TOOLS, VADER_TOOLS, RAVEN_TOOLS, ZIRO_TOOLS };