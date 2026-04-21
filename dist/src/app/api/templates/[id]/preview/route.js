import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { renderTemplateForContext } from "@/lib/templates/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
export async function POST(req, ctx) {
    var _a, _b, _c, _d, _e;
    try {
        const session = await requirePermission("templates.read")();
        const { id } = await ctx.params;
        const payload = ((_a = (await req.json().catch(() => null))) !== null && _a !== void 0 ? _a : {});
        const tenantHint = ((_c = (_b = payload.tenantId) !== null && _b !== void 0 ? _b : session.tenantId) !== null && _c !== void 0 ? _c : "").trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        const rendered = await renderTemplateForContext({
            templateId: id,
            versionId: payload.versionId,
            context: ((_d = payload.context) !== null && _d !== void 0 ? _d : {}),
            tenantId: tenantHint || undefined,
        });
        await logAudit("templates.api.preview", {
            tenantId: tenantHint,
            profileId: session.userId,
            templateId: id,
            versionId: (_e = payload.versionId) !== null && _e !== void 0 ? _e : null,
            missing: rendered.missingMergeFields.length,
            source: "api",
        });
        return ok({ data: rendered });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        if (err instanceof Error &&
            (err.message === "TEMPLATE_NOT_FOUND" ||
                err.message === "TEMPLATE_VERSION_NOT_FOUND")) {
            return notFound(err.message);
        }
        if (err instanceof Error && err.message === "INVALID_BODY") {
            return badRequest("INVALID_BODY");
        }
        return serverError(err);
    }
}
