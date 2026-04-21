import { ok, readJson, serverError } from "@/lib/http";
import { listBrandingLayouts, saveLayout } from "@/lib/branding";
import { jsonAdminError, resolveBrandingAdminOperatorContext, } from "../_auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { tenantId } = await resolveBrandingAdminOperatorContext(req);
        const layouts = await listBrandingLayouts(tenantId);
        return ok({ data: { layouts, tenantId } });
    }
    catch (err) {
        const j = jsonAdminError(err);
        if (j)
            return j;
        return serverError(err);
    }
}
export async function PATCH(req) {
    var _a, _b;
    try {
        const { tenantId } = await resolveBrandingAdminOperatorContext(req);
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        if (!((_b = body.layout) === null || _b === void 0 ? void 0 : _b.scope)) {
            return Response.json({ error: "layout.scope required" }, { status: 400 });
        }
        const layout = await saveLayout(tenantId, Object.assign(Object.assign({}, body.layout), { scope: body.layout.scope }));
        return ok({ data: { layout } });
    }
    catch (err) {
        const j = jsonAdminError(err);
        if (j)
            return j;
        return serverError(err);
    }
}
