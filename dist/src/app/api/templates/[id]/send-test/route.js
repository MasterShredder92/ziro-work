import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { sendTestMessage } from "@/lib/templates/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
export async function POST(req, ctx) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const session = await requirePermission("templates.write")();
        const { id } = await ctx.params;
        const payload = ((_a = (await req.json().catch(() => null))) !== null && _a !== void 0 ? _a : {});
        const targetProfileId = ((_c = (_b = payload.targetProfileId) !== null && _b !== void 0 ? _b : session.userId) !== null && _c !== void 0 ? _c : "").trim();
        if (!targetProfileId) {
            return badRequest("INVALID_BODY", {
                expected: { targetProfileId: "string" },
            });
        }
        const tenantHint = ((_e = (_d = payload.tenantId) !== null && _d !== void 0 ? _d : session.tenantId) !== null && _e !== void 0 ? _e : "").trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        const result = await sendTestMessage({
            templateId: id,
            versionId: payload.versionId,
            targetProfileId,
            context: ((_f = payload.context) !== null && _f !== void 0 ? _f : {}),
            tenantId: tenantHint || undefined,
            subjectOverride: (_g = payload.subjectOverride) !== null && _g !== void 0 ? _g : null,
        });
        await logAudit("templates.api.send_test", {
            tenantId: tenantHint,
            profileId: session.userId,
            templateId: id,
            targetProfileId,
            threadId: result.delivery.threadId,
            messageId: result.delivery.messageId,
            simulated: result.delivery.simulated,
            source: "api",
        });
        return ok({ data: result });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        if (err instanceof Error &&
            (err.message === "TEMPLATE_NOT_FOUND" ||
                err.message === "TEMPLATE_VERSION_NOT_FOUND")) {
            return notFound(err.message);
        }
        return serverError(err);
    }
}
