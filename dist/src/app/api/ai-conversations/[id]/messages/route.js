import { z } from "zod";
import { appendAIMessage, listAIMessages, } from "@data/aiConversations";
import { badRequest, created, ok, parseListQuery, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const data = await listAIMessages(id, tenantId, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const MessageCreateSchema = z.object({
    profile_id: z.string().uuid(),
    role: z.enum(["user", "assistant", "system", "tool"]),
    content: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    error_text: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    usage: z.record(z.string(), z.unknown()).nullable().optional(),
});
export async function POST(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = MessageCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid ai_message payload", parsed.error.flatten());
        }
        const row = await appendAIMessage(tenantId, Object.assign({ conversation_id: id }, parsed.data));
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
