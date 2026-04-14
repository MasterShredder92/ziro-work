import { getServiceClient } from "@/lib/supabase";
import type { Runtime } from "@/types/orchestrator";

interface SkillProposal {
  key: string;
  name: string;
  description: string;
  category: string;
  system_prompt_fragment: string;
  preferred_runtime: Runtime;
  cost_tier?: number;
  risk_tier?: number;
  business_context?: string;
  tags?: string[];
  reason: string;
}

/**
 * STAR proposes a new skill when routing detects a gap.
 * Creates a draft skill record that requires admin approval before activation.
 * Returns the draft skill ID for task logging.
 */
export async function proposeSkill(proposal: SkillProposal): Promise<{ id: string; key: string } | null> {
  const supabase = getServiceClient();

  // Check if a skill with this key already exists (any status)
  const { data: existing } = await supabase
    .from("skills")
    .select("id, key, approval_status, is_active")
    .eq("key", proposal.key)
    .limit(1);

  if (existing && existing.length > 0) {
    const skill = existing[0];
    // If it exists but is rejected, allow re-proposal as pending
    if (skill.approval_status === "rejected") {
      await supabase
        .from("skills")
        .update({
          approval_status: "pending_approval",
          description: proposal.description,
          system_prompt_fragment: proposal.system_prompt_fragment,
          prompt_fragment: proposal.system_prompt_fragment,
          proposed_by: "star",
          updated_at: new Date().toISOString(),
        })
        .eq("id", skill.id);
      console.log(`[SKILL-PROPOSE] Re-proposed rejected skill: ${proposal.key}`);
      return { id: skill.id, key: skill.key };
    }
    // Already exists in some valid state — skip
    console.log(`[SKILL-PROPOSE] Skill "${proposal.key}" already exists (${skill.approval_status})`);
    return { id: skill.id, key: skill.key };
  }

  // Create draft skill
  const { data, error } = await supabase
    .from("skills")
    .insert({
      key: proposal.key,
      name: proposal.name,
      description: proposal.description,
      category: proposal.category,
      system_prompt_fragment: proposal.system_prompt_fragment,
      preferred_runtime: proposal.preferred_runtime,
      cost_tier: proposal.cost_tier || 1,
      risk_tier: proposal.risk_tier || 1,
      business_context: proposal.business_context || "music_school",
      tags: proposal.tags || [],
      allowed_tools: [],
      is_active: false,
      approval_status: "pending_approval",
      proposed_by: "star",
      // Sync aliases
      slug: proposal.key,
      prompt_fragment: proposal.system_prompt_fragment,
      runtime: proposal.preferred_runtime,
    })
    .select("id, key")
    .single();

  if (error) {
    console.error(`[SKILL-PROPOSE] Failed to create draft: ${error.message}`);
    return null;
  }

  console.log(`[SKILL-PROPOSE] Created draft skill: ${proposal.key} (${data.id}) — reason: ${proposal.reason}`);
  return data;
}
