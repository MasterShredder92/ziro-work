import { requirePermission } from "@/lib/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/http";
import { renderTemplateForContext } from "@/lib/templates/service";
function forbidden() {
    return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
    });
}
export async function POST(req) {
    var _a;
    try {
        await requirePermission("templates.read")();
        const body = (await req.json().catch(() => null));
        if (!body || typeof body.templateId !== "string") {
            return badRequest("INVALID_BODY", {
                expected: { templateId: "string", context: "object" },
            });
        }
        const context = ((_a = body.context) !== null && _a !== void 0 ? _a : {});
        const rendered = await renderTemplateForContext({
            templateId: body.templateId,
            versionId: body.versionId,
            context,
            tenantId: body.tenantId,
        });
        return ok({ data: rendered });
    }
    catch (err) {
        if (err instanceof Error) {
            if (err.message === "FORBIDDEN")
                return forbidden();
            if (err.message === "TEMPLATE_NOT_FOUND" ||
                err.message === "TEMPLATE_VERSION_NOT_FOUND") {
                return notFound(err.message);
            }
        }
        return serverError(err);
    }
}
