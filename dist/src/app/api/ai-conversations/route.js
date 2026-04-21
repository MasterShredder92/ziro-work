import { z } from "zod";
import { createAIConversation, listAIConversations, } from "@data/aiConversations";
import { badRequest, created, ok, parseListQuery, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c;
    try {
        const tenantId = resolveTenantId(req);
        const url = new URL(req.url);
        const filter = {
            profile_id: (_a = url.searchParams.get("profile_id")) !== null && _a !== void 0 ? _a : undefined,
            source: (_b = url.searchParams.get("source")) !== null && _b !== void 0 ? _b : undefined,
            client_route: (_c = url.searchParams.get("client_route")) !== null && _c !== void 0 ? _c : undefined,
        };
        const data = await listAIConversations(tenantId, filter, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const ConversationCreateSchema = z.object({
    profile_id: z.string().uuid(),
    client_route: z.string().nullable().optional(),
    source: z.string().optional(),
    page_context: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export async function POST(req) {
    try {
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = ConversationCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid ai_conversation payload", parsed.error.flatten());
        }
        const row = await createAIConversation(tenantId, parsed.data);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
