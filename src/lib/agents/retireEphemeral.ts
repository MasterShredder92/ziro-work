import { getServiceClient } from "@/lib/supabase";

/**
 * Retire an ephemeral agent after task completion and review.
 * - Removes from active canvas (is_visible_in_ui = false)
 * - Marks as archived (is_archived = true)
 * - Sets status to 'retired'
 * - Zeroes current_load
 * - Preserves ALL history: task runs, reviews, threads, artifacts, failures
 *
 * Only retires if mode === 'ephemeral'. Persistent agents are never auto-retired.
 */
export async function retireEphemeralAgent(agentId: string): Promise<boolean> {
  const supabase = getServiceClient();

  // Only retire ephemeral agents
  const { data: agent } = await supabase
    .from("agents")
    .select("id, mode, slug")
    .eq("id", agentId)
    .single();

  if (!agent || agent.mode !== "ephemeral") {
    return false;
  }

  const { error } = await supabase
    .from("agents")
    .update({
      status: "retired",
      is_visible_in_ui: false,
      is_archived: true,
      current_load: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agentId);

  if (error) {
    console.error(`[RETIRE] Failed to retire ephemeral agent ${agentId}: ${error.message}`);
    return false;
  }

  console.log(`[RETIRE] Ephemeral agent ${agent.slug} (${agentId}) retired — removed from active canvas, history preserved.`);
  return true;
}

/**
 * Decrement agent load after task completion.
 * For persistent agents, just decrements. For ephemeral, also retires.
 */
export async function releaseAgentLoad(agentId: string, isEphemeral: boolean): Promise<void> {
  const supabase = getServiceClient();

  if (isEphemeral) {
    await retireEphemeralAgent(agentId);
  } else {
    // Decrement persistent agent load
    const { data: agent } = await supabase
      .from("agents")
      .select("current_load")
      .eq("id", agentId)
      .single();

    if (agent) {
      await supabase
        .from("agents")
        .update({
          current_load: Math.max(0, (agent.current_load || 1) - 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId);
    }
  }
}
