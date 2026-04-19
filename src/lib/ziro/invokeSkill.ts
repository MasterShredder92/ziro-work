import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import {
  findSkillInPacks,
  runSkillPackSkill,
  type SkillHandlerOutput,
} from "@/lib/ziro/skills";

export type InvokeSkillContext = {
  tenantId?: string;
  profileId?: string;
  conversationId?: string;
  locationId?: string;
  input?: string;
  extra?: Record<string, unknown>;
};

export type InvokeSkillResult = {
  skillId: string;
  agent: string;
  key: string;
  ok: boolean;
  output?: SkillHandlerOutput;
  error?: { message: string; code?: string };
  durationMs: number;
  startedAt: string;
};

function buildInput(ctx: InvokeSkillContext): string {
  if (ctx.input && ctx.input.trim().length > 0) return ctx.input;
  const parts: string[] = [];
  if (ctx.locationId) parts.push(`location=${ctx.locationId}`);
  if (ctx.extra) {
    for (const [k, v] of Object.entries(ctx.extra)) {
      if (v === undefined || v === null) continue;
      parts.push(`${k}=${String(v)}`);
    }
  }
  return parts.join(" ");
}

export async function invokeSkill(
  skillId: string,
  ctx: InvokeSkillContext = {},
): Promise<InvokeSkillResult> {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const t0 = Date.now();

  const hit = findSkillInPacks(skillId);
  if (!hit) {
    return {
      skillId,
      agent: "unknown",
      key: skillId,
      ok: false,
      error: { message: `Skill '${skillId}' not found in skill packs`, code: "SKILL_NOT_FOUND" },
      durationMs: Date.now() - t0,
      startedAt,
    };
  }

  try {
    const output = await runSkillPackSkill(skillId, {
      input: buildInput(ctx),
      tenantId: ctx.tenantId ?? DEFAULT_TENANT_ID,
      profileId: ctx.profileId ?? "system",
      conversationId: ctx.conversationId ?? `director-${startedAtDate.getTime()}`,
    });
    return {
      skillId,
      agent: hit.agent,
      key: hit.key,
      ok: true,
      output,
      durationMs: Date.now() - t0,
      startedAt,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code?: unknown }).code)
        : undefined;
    return {
      skillId,
      agent: hit.agent,
      key: hit.key,
      ok: false,
      error: { message, code },
      durationMs: Date.now() - t0,
      startedAt,
    };
  }
}
