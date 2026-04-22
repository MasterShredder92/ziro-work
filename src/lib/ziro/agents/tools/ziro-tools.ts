/**
 * Ziro Orchestrator Tools — THE SOVEREIGN SYSTEM
 * 
 * Role: Ziro (The Director/CEO)
 * Focus: Strategic Coordination, Delegation, and Global State Management
 */
import { createClient } from "@supabase/supabase-js";
import { executeTool } from "./index";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * delegate_to_agent
 * Ziro's primary tool for commanding specialists (Ruby, Raven, Bub, etc.)
 */
export async function delegate_to_agent({
  agentId,
  toolName,
  parameters,
  reason,
}: {
  agentId: string;
  toolName: string;
  parameters: Record<string, any>;
  reason: string;
}) {
  const supabase = getSupabase();

  // 1. Log the Command (The "Sovereign Audit Trail")
  const { data: task, error: taskError } = await supabase
    .from("agent_tasks")
    .insert({
      tenant_id: TENANT_ID,
      parent_agent_id: "ziro",
      target_agent_id: agentId,
      tool_name: toolName,
      input_data: parameters,
      status: "pending",
      reason: reason,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (taskError) return { success: false, error: `Failed to log delegation: ${taskError.message}` };

  // 2. Execute the Specialist's Tool
  console.log(`[ZIRO COMMAND] Delegating ${toolName} to ${agentId}: ${reason}`);
  const response = await executeTool(toolName, parameters);

  // 3. Update Task Status
  await supabase
    .from("agent_tasks")
    .update({
      status: response.success ? "completed" : "failed",
      output_data: response.result || response.error,
      completed_at: new Date().toISOString(),
    })
    .eq("id", task.id);

  return {
    success: response.success,
    agentId,
    toolName,
    result: response.result,
    error: response.error,
    taskId: task.id,
  };
}

/**
 * get_global_state
 * Ziro's tool for scanning the entire business for "Imperfections"
 */
export async function get_global_state({
  scope = "all",
}: {
  scope?: "all" | "schedule" | "financials" | "leads";
}) {
  const supabase = getSupabase();
  const state: any = { timestamp: new Date().toISOString() };

  if (scope === "all" || scope === "schedule") {
    // Scan for gaps or teacher callouts
    const { data: gaps } = await supabase
      .from("schedule_blocks")
      .select("id, start_time, status")
      .eq("status", "available")
      .limit(10);
    state.schedule_gaps = gaps || [];
  }

  if (scope === "all" || scope === "financials") {
    // Scan for unpaid invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, total, status")
      .eq("status", "unpaid")
      .limit(5);
    state.unpaid_invoices = invoices || [];
  }

  return { success: true, state };
}

export const ZIRO_TOOLS = {
  delegate_to_agent,
  get_global_state,
};
