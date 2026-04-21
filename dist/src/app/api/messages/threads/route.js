import "server-only";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { createThread, listThreadsForUser, } from "@/lib/messaging/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
export async function GET(req) {
    var _a, _b, _c, _d, _e;
    try {
        const session = await requirePermission("messages.read")();
        await assertTenantAccess(session.tenantId);
        const url = new URL(req.url);
        const filter = {
            status: (_a = url.searchParams.get("status")) !== null && _a !== void 0 ? _a : undefined,
            channelType: (_b = url.searchParams.get("channelType")) !== null && _b !== void 0 ? _b : undefined,
            contextType: (_c = url.searchParams.get("contextType")) !== null && _c !== void 0 ? _c : undefined,
            contextId: (_d = url.searchParams.get("contextId")) !== null && _d !== void 0 ? _d : undefined,
            search: (_e = url.searchParams.get("q")) !== null && _e !== void 0 ? _e : undefined,
            limit: url.searchParams.get("limit")
                ? Number(url.searchParams.get("limit"))
                : undefined,
            offset: url.searchParams.get("offset")
                ? Number(url.searchParams.get("offset"))
                : undefined,
        };
        const result = await listThreadsForUser(session.tenantId, session.userId, filter);
        await logAudit("messages.threads.list", {
            tenantId: session.tenantId,
            count: result.threads.length,
        });
        return ok({ data: result });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function POST(req) {
    var _a, _b, _c, _d, _e;
    try {
        const session = await requirePermission("messages.write")();
        await assertTenantAccess(session.tenantId);
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        const participantIds = Array.isArray(body.participantIds)
            ? body.participantIds.filter((id) => typeof id === "string" && id.length > 0)
            : [];
        if (participantIds.length === 0) {
            return badRequest("At least one recipient is required");
        }
        const thread = await createThread(session.tenantId, session.userId, {
            subject: (_b = body.subject) !== null && _b !== void 0 ? _b : null,
            channelType: (_c = body.channelType) !== null && _c !== void 0 ? _c : "in_app",
            participantIds,
            contextType: (_d = body.contextType) !== null && _d !== void 0 ? _d : null,
            contextId: (_e = body.contextId) !== null && _e !== void 0 ? _e : null,
        });
        await logAudit("messages.threads.create", {
            tenantId: session.tenantId,
            threadId: thread.id,
        });
        return created({ data: thread });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
