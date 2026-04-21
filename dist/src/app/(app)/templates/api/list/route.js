import { requirePermission } from "@/lib/auth/guards";
import { badRequest, ok, serverError } from "@/lib/http";
import { createTemplateForTenant, listTemplatesForTenant, } from "@/lib/templates/service";
export async function GET() {
    try {
        await requirePermission("templates.read")();
        const templates = await listTemplatesForTenant();
        return ok({ data: templates });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
                status: 403,
                headers: { "content-type": "application/json" },
            });
        }
        return serverError(err);
    }
}
export async function POST(req) {
    var _a, _b, _c, _d;
    try {
        const session = await requirePermission("templates.write")();
        const body = (await req.json().catch(() => null));
        if (!body || typeof body.name !== "string" || typeof body.body !== "string") {
            return badRequest("INVALID_BODY", {
                expected: { name: "string", body: "string" },
            });
        }
        const created = await createTemplateForTenant(Object.assign(Object.assign({}, body), { createdBy: (_b = (_a = body.createdBy) !== null && _a !== void 0 ? _a : session.userId) !== null && _b !== void 0 ? _b : null, updatedBy: (_d = (_c = body.updatedBy) !== null && _c !== void 0 ? _c : session.userId) !== null && _d !== void 0 ? _d : null }));
        return ok({ data: created });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
                status: 403,
                headers: { "content-type": "application/json" },
            });
        }
        return serverError(err);
    }
}
