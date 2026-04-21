"use server";
import { z } from "zod";
import { runTurn } from "@/lib/ziro/conversationPipeline";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RunZiroTurnSchema = z.object({
    conversationId: z.string().uuid().optional(),
    agent: z.string().min(1).optional(),
    skill: z.string().min(1).optional(),
    input: z.string().min(1),
    tenantId: z.string().uuid().optional(),
    profileId: z.string().uuid(),
    pathname: z.string().optional(),
    pageKey: z.string().optional(),
    model: z.string().optional(),
    maxTokens: z.number().int().positive().optional(),
    temperature: z.number().optional(),
});
export async function runZiroTurn(args) {
    const parsed = RunZiroTurnSchema.safeParse(args);
    if (!parsed.success) {
        throw new Error(`runZiroTurn: invalid input: ${JSON.stringify(parsed.error.flatten())}`);
    }
    const { conversationId, agent, skill, input, tenantId, profileId, pathname, pageKey, model, maxTokens, temperature, } = parsed.data;
    const agentIsUuid = agent ? UUID_RE.test(agent) : false;
    const effectiveTenantId = tenantId !== null && tenantId !== void 0 ? tenantId : DEFAULT_TENANT_ID;
    await assertTenantAccess(effectiveTenantId);
    await logAudit("ziro.runTurn", {
        tenantId: effectiveTenantId,
        profileId,
        conversationId,
        agent,
        skill,
        pageKey,
    });
    return runTurn({
        tenantId: effectiveTenantId,
        profileId,
        conversationId,
        agentId: agentIsUuid ? agent : undefined,
        agentName: agentIsUuid ? undefined : agent,
        skillKey: skill,
        pathname,
        pageKey,
        input,
        model,
        maxTokens,
        temperature,
    });
}
