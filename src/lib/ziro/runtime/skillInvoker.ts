import "server-only";
import {
  resolveSkillPackSkill,
  runSkillPackSkill,
  type SkillHandlerInput,
  type SkillHandlerOutput,
} from "@/lib/ziro/skills";
import { resolveSkill } from "./skillRegistry";
import { runTurn, type TurnResult } from "./conversationPipeline";
import {
  recordSkillFailure,
  recordSkillStart,
  recordSkillSuccess,
} from "./skillTelemetry";

export type InvokeSkillInput = {
  input?: string;
  tenantId?: string | null;
  profileId?: string | null;
  conversationId?: string | null;
  agent?: string | null;
};

export type InvokeSkillResult =
  | {
      ok: true;
      source: "pack";
      skillId: string;
      output: SkillHandlerOutput;
    }
  | {
      ok: true;
      source: "db";
      skillId: string;
      turn: TurnResult;
    }
  | {
      ok: false;
      source: null;
      error: string;
    };

function buildHandlerArgs(
  input: InvokeSkillInput,
  text: string,
): SkillHandlerInput {
  return {
    input: text,
    tenantId: input.tenantId ?? "",
    profileId: input.profileId ?? "",
    conversationId: input.conversationId ?? "",
  };
}

export async function invokeSkill(
  skillId: string,
  input: InvokeSkillInput = {},
): Promise<InvokeSkillResult> {
  if (!skillId || typeof skillId !== "string") {
    return { ok: false, source: null, error: "SKILL_ID_REQUIRED" };
  }

  const text = typeof input.input === "string" ? input.input : "";
  const packHit = resolveSkillPackSkill(skillId);

  if (packHit) {
    const start = recordSkillStart({
      agentSlug: packHit.agentSlug,
      skillKey: `${packHit.agentSlug}.${packHit.skillKey}`,
      source: "pack",
      conversationId: input.conversationId ?? null,
      profileId: input.profileId ?? null,
      tenantId: input.tenantId ?? null,
      metadata: { via: "invokeSkill" },
    });
    try {
      const output = await runSkillPackSkill(
        skillId,
        buildHandlerArgs(input, text),
      );
      recordSkillSuccess({ start });
      return {
        ok: true,
        source: "pack",
        skillId,
        output,
      };
    } catch (error) {
      recordSkillFailure({ start, error });
      return {
        ok: false,
        source: null,
        error: error instanceof Error ? error.message : "SKILL_PACK_ERROR",
      };
    }
  }

  const dbSkill = await resolveSkill(skillId, {
    businessContext: input.tenantId ?? null,
  });
  if (!dbSkill) {
    return { ok: false, source: null, error: "SKILL_NOT_FOUND" };
  }

  try {
    const turn = await runTurn({
      conversationId: input.conversationId ?? null,
      agent: input.agent ?? null,
      skill: dbSkill.slug ?? dbSkill.key ?? dbSkill.id,
      input: text.length > 0 ? text : dbSkill.name,
      tenantId: input.tenantId ?? null,
      profileId: input.profileId ?? null,
    });
    return {
      ok: true,
      source: "db",
      skillId: dbSkill.id,
      turn,
    };
  } catch (error) {
    return {
      ok: false,
      source: null,
      error: error instanceof Error ? error.message : "SKILL_DB_ERROR",
    };
  }
}

export async function safeInvokeSkill(
  skillId: string,
  input: InvokeSkillInput = {},
): Promise<InvokeSkillResult> {
  try {
    return await invokeSkill(skillId, input);
  } catch (error) {
    return {
      ok: false,
      source: null,
      error: error instanceof Error ? error.message : "SKILL_INVOKE_ERROR",
    };
  }
}
