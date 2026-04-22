/**
 * invokeSkill — STUB
 * The agent skill system has been removed. This stub preserves type compatibility
 * for domain orchestrators (director, leads, teacher) until they are refactored.
 */

export type InvokeSkillResult = {
  ok: boolean;
  output?: unknown;
  error?: string;
  durationMs?: number;
};

export async function invokeSkill(
  _skillKey: string,
  _input: Record<string, unknown>,
  _options?: { tenantId?: string; profileId?: string }
): Promise<InvokeSkillResult> {
  return {
    ok: false,
    error: "Skill system not available. Agent layer removed.",
    durationMs: 0,
  };
}
