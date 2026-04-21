import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, created, notFound, ok, serverError } from "@/lib/http";
import { createTemplateVersionForTenant, getTemplateSurface, } from "@/lib/templates/service";
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
        const { id } = await ctx.params;
        const url = new URL(req.url);
        const tenantHint = ((_a = url.searchParams.get("tenantId")) !== null && _a !== void 0 ? _a : session.tenantId).trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        const surface = await getTemplateSurface(id, tenantHint || undefined);
        if (!surface)
            return notFound("TEMPLATE_NOT_FOUND");
        await logAudit("templates.api.versions.list", {
            tenantId: surface.template.tenantId,
            profileId: session.userId,
            templateId: surface.template.id,
            count: surface.versions.length,
            source: "api",
        });
        return ok({ data: surface.versions });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function POST(req, ctx) {
    var _a, _b, _c, _d;
    try {
        const session = await requirePermission("templates.write")();
        const { id } = await ctx.params;
        const payload = (await req.json().catch(() => null));
        if (!payload || typeof payload.body !== "string") {
            return badRequest("INVALID_BODY", { expected: { body: "string" } });
        }
        const tenantHint = ((_b = (_a = payload.tenantId) !== null && _a !== void 0 ? _a : session.tenantId) !== null && _b !== void 0 ? _b : "").trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        const version = await createTemplateVersionForTenant(id, {
            body: payload.body,
            subject: payload.subject,
            changeSummary: (_c = payload.changeSummary) !== null && _c !== void 0 ? _c : null,
            isCurrent: payload.isCurrent === true,
            createdBy: (_d = session.userId) !== null && _d !== void 0 ? _d : null,
        }, tenantHint || undefined);
        await logAudit("templates.api.versions.create", {
            tenantId: version.tenantId,
            profileId: session.userId,
            templateId: version.templateId,
            versionId: version.id,
            version: version.version,
            source: "api",
        });
        return created({ data: version });
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
