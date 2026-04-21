import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { notFound, ok, serverError } from "@/lib/http";
import { getTemplateVersionForTenant, restoreTemplateVersionForTenant, } from "@/lib/templates/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
export async function GET(req, ctx) {
    var _a;
    try {
        const session = await requirePermission("templates.read")();
        const { id, versionId } = await ctx.params;
        const url = new URL(req.url);
        const tenantHint = ((_a = url.searchParams.get("tenantId")) !== null && _a !== void 0 ? _a : session.tenantId).trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        const version = await getTemplateVersionForTenant(id, versionId, tenantHint || undefined);
        if (!version)
            return notFound("TEMPLATE_VERSION_NOT_FOUND");
        await logAudit("templates.api.versions.get", {
            tenantId: version.tenantId,
            profileId: session.userId,
            templateId: version.templateId,
            versionId: version.id,
            source: "api",
        });
        return ok({ data: version });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        if (err instanceof Error && err.message === "TEMPLATE_NOT_FOUND") {
            return notFound("TEMPLATE_NOT_FOUND");
        }
        return serverError(err);
    }
}
export async function POST(req, ctx) {
    var _a, _b, _c, _d;
    try {
        const session = await requirePermission("templates.write")();
        const { id, versionId } = await ctx.params;
        const payload = ((_a = (await req.json().catch(() => null))) !== null && _a !== void 0 ? _a : {});
        const tenantHint = ((_c = (_b = payload.tenantId) !== null && _b !== void 0 ? _b : session.tenantId) !== null && _c !== void 0 ? _c : "").trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        const result = await restoreTemplateVersionForTenant(id, versionId, tenantHint || undefined, { changeSummary: (_d = payload.changeSummary) !== null && _d !== void 0 ? _d : null });
        await logAudit("templates.api.versions.restore", {
            tenantId: result.version.tenantId,
            profileId: session.userId,
            templateId: result.version.templateId,
            versionId: result.version.id,
            restoredFrom: versionId,
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
