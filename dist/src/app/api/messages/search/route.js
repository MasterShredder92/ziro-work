import "server-only";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { searchMessages } from "@/lib/messaging/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
export async function GET(req) {
    var _a, _b;
    try {
        const session = await requirePermission("messages.read")();
        await assertTenantAccess(session.tenantId);
        const url = new URL(req.url);
        const query = (_b = (_a = url.searchParams.get("q")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        if (!query)
            return badRequest("Missing search query");
        const limit = url.searchParams.get("limit")
            ? Number(url.searchParams.get("limit"))
            : undefined;
        const hits = await searchMessages(session.tenantId, session.userId, query, limit);
        await logAudit("messages.search", {
            tenantId: session.tenantId,
            profileId: session.userId,
            query,
            count: hits.length,
        });
        return ok({ data: hits });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
