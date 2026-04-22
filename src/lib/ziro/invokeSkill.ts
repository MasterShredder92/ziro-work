/**
 * invokeSkill — STUB
 * The agent skill system has been removed. This stub preserves type compatibility
 * for domain orchestrators (director, leads, teacher) until they are refactored.
 */

export type InvokeSkillContext = {
  tenantId?: string;
  profileId?: string;
  conversationId?: string;
  extra?: Record<string, unknown>;
};

export type InvokeSkillResult = {
  ok: boolean;
  result?: unknown;
  output?: Record<string, unknown>;
  error?: { message: string; code?: string };
  durationMs: number;
  startedAt: string;
  skillId?: string;
};

export async function invokeSkill(
  _skillKey: string,
  _input: Record<string, unknown>,
  _options?: InvokeSkillContext
): Promise<InvokeSkillResult> {
  return {
    ok: false,
    error: { message: "Skill system not available. Agent layer removed." },
    durationMs: 0,
    startedAt: new Date().toISOString(),
  };
}
