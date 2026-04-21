import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { badRequest, noContent, notFound, ok, serverError } from "@/lib/http";
import { createTemplateVersionForTenant, deleteTemplateForTenant, getTemplateSurface, updateTemplateForTenant, } from "@/lib/templates/service";
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
        const tenantId = ((_a = url.searchParams.get("tenantId")) !== null && _a !== void 0 ? _a : session.tenantId).trim();
        if (tenantId)
            await assertTenantAccess(tenantId);
        const surface = await getTemplateSurface(id, tenantId || undefined);
        if (!surface)
            return notFound("TEMPLATE_NOT_FOUND");
        await logAudit("templates.api.get", {
            tenantId: surface.template.tenantId,
            profileId: session.userId,
            templateId: surface.template.id,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function PATCH(req, ctx) {
    var _a, _b, _c, _d;
    try {
        const session = await requirePermission("templates.write")();
        const { id } = await ctx.params;
        const payload = (await req.json().catch(() => null));
        if (!payload)
            return badRequest("INVALID_BODY");
        const tenantHint = ((_b = (_a = payload.tenantId) !== null && _a !== void 0 ? _a : session.tenantId) !== null && _b !== void 0 ? _b : "").trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        const updates = {
            name: payload.name,
            slug: payload.slug,
            description: payload.description,
            category: payload.category,
            channel: payload.channel,
            subject: payload.subject,
            body: payload.body,
            isArchived: payload.isArchived,
            updatedBy: (_c = session.userId) !== null && _c !== void 0 ? _c : null,
        };
        const updated = await updateTemplateForTenant(id, updates, tenantHint || undefined);
        let version = null;
        if (payload.newVersion && typeof payload.newVersion.body === "string") {
            version = await createTemplateVersionForTenant(id, {
                body: payload.newVersion.body,
                subject: payload.newVersion.subject,
                changeSummary: payload.newVersion.changeSummary,
                isCurrent: payload.newVersion.isCurrent === true,
                createdBy: (_d = session.userId) !== null && _d !== void 0 ? _d : null,
            }, tenantHint || undefined);
        }
        await logAudit("templates.api.patch", {
            tenantId: updated.tenantId,
            profileId: session.userId,
            templateId: updated.id,
            newVersion: version ? version.id : null,
            source: "api",
        });
        return ok({ data: { template: updated, version } });
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
export async function DELETE(req, ctx) {
    var _a;
    try {
        const session = await requirePermission("templates.write")();
        const { id } = await ctx.params;
        const url = new URL(req.url);
        const tenantHint = ((_a = url.searchParams.get("tenantId")) !== null && _a !== void 0 ? _a : session.tenantId).trim();
        if (tenantHint)
            await assertTenantAccess(tenantHint);
        await deleteTemplateForTenant(id, tenantHint || undefined);
        await logAudit("templates.api.delete", {
            tenantId: tenantHint,
            profileId: session.userId,
            templateId: id,
            source: "api",
        });
        return noContent();
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
