import "server-only";
import { resolveSkillPackSkill, runSkillPackSkill, } from "@/lib/ziro/skills";
import { resolveSkill } from "./skillRegistry";
import { runTurn } from "./conversationPipeline";
import { recordSkillFailure, recordSkillStart, recordSkillSuccess, } from "./skillTelemetry";
function buildHandlerArgs(input, text) {
    var _a, _b, _c;
    return {
        input: text,
        tenantId: (_a = input.tenantId) !== null && _a !== void 0 ? _a : "",
        profileId: (_b = input.profileId) !== null && _b !== void 0 ? _b : "",
        conversationId: (_c = input.conversationId) !== null && _c !== void 0 ? _c : "",
    };
}
export async function invokeSkill(skillId, input = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
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
            conversationId: (_a = input.conversationId) !== null && _a !== void 0 ? _a : null,
            profileId: (_b = input.profileId) !== null && _b !== void 0 ? _b : null,
            tenantId: (_c = input.tenantId) !== null && _c !== void 0 ? _c : null,
            metadata: { via: "invokeSkill" },
        });
        try {
            const output = await runSkillPackSkill(skillId, buildHandlerArgs(input, text));
            recordSkillSuccess({ start });
            return {
                ok: true,
                source: "pack",
                skillId,
                output,
            };
        }
        catch (error) {
            recordSkillFailure({ start, error });
            return {
                ok: false,
                source: null,
                error: error instanceof Error ? error.message : "SKILL_PACK_ERROR",
            };
        }
    }
    const dbSkill = await resolveSkill(skillId, {
        businessContext: (_d = input.tenantId) !== null && _d !== void 0 ? _d : null,
    });
    if (!dbSkill) {
        return { ok: false, source: null, error: "SKILL_NOT_FOUND" };
    }
    try {
        const turn = await runTurn({
            conversationId: (_e = input.conversationId) !== null && _e !== void 0 ? _e : null,
            agent: (_f = input.agent) !== null && _f !== void 0 ? _f : null,
            skill: (_h = (_g = dbSkill.slug) !== null && _g !== void 0 ? _g : dbSkill.key) !== null && _h !== void 0 ? _h : dbSkill.id,
            input: text.length > 0 ? text : dbSkill.name,
            tenantId: (_j = input.tenantId) !== null && _j !== void 0 ? _j : null,
            profileId: (_k = input.profileId) !== null && _k !== void 0 ? _k : null,
        });
        return {
            ok: true,
            source: "db",
            skillId: dbSkill.id,
            turn,
        };
    }
    catch (error) {
        return {
            ok: false,
            source: null,
            error: error instanceof Error ? error.message : "SKILL_DB_ERROR",
        };
    }
}
export async function safeInvokeSkill(skillId, input = {}) {
    try {
        return await invokeSkill(skillId, input);
    }
    catch (error) {
        return {
            ok: false,
            source: null,
            error: error instanceof Error ? error.message : "SKILL_INVOKE_ERROR",
        };
    }
}
