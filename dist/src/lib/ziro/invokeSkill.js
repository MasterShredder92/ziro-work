import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { findSkillInPacks, runSkillPackSkill, } from "@/lib/ziro/skills";
function buildInput(ctx) {
    if (ctx.input && ctx.input.trim().length > 0)
        return ctx.input;
    const parts = [];
    if (ctx.locationId)
        parts.push(`location=${ctx.locationId}`);
    if (ctx.extra) {
        for (const [k, v] of Object.entries(ctx.extra)) {
            if (v === undefined || v === null)
                continue;
            parts.push(`${k}=${String(v)}`);
        }
    }
    return parts.join(" ");
}
export async function invokeSkill(skillId, ctx = {}) {
    var _a, _b, _c;
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
            tenantId: (_a = ctx.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID,
            profileId: (_b = ctx.profileId) !== null && _b !== void 0 ? _b : "system",
            conversationId: (_c = ctx.conversationId) !== null && _c !== void 0 ? _c : `director-${startedAtDate.getTime()}`,
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
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = err && typeof err === "object" && "code" in err
            ? String(err.code)
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
