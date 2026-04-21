import { z } from "zod";
import { runTurn } from "@/lib/ziro/conversationPipeline";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ChatRequestSchema = z.object({
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
export async function POST(req) {
    try {
        const body = await readJson(req);
        const parsed = ChatRequestSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid chat payload", parsed.error.flatten());
        }
        const { conversationId, agent, skill, input, tenantId, profileId, pathname, pageKey, model, maxTokens, temperature } = parsed.data;
        const agentIsUuid = agent ? UUID_RE.test(agent) : false;
        const result = await runTurn({
            tenantId: tenantId !== null && tenantId !== void 0 ? tenantId : DEFAULT_TENANT_ID,
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
        return ok(result);
    }
    catch (err) {
        return serverError(err);
    }
}
