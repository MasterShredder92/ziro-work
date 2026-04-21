import { ok, readJson, serverError } from "@/lib/http";
import { getPrimaryBrandingEmailIdentity, listBrandingEmailIdentities, saveEmailIdentity, sendTestEmailIdentity, } from "@/lib/branding";
import { jsonAdminError, resolveBrandingAdminOperatorContext, } from "../_auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { tenantId } = await resolveBrandingAdminOperatorContext(req);
        const [identities, primary] = await Promise.all([
            listBrandingEmailIdentities(tenantId),
            getPrimaryBrandingEmailIdentity(tenantId),
        ]);
        return ok({
            data: { identities, primary, tenantId },
        });
    }
    catch (err) {
        const j = jsonAdminError(err);
        if (j)
            return j;
        return serverError(err);
    }
}
export async function PATCH(req) {
    var _a, _b, _c, _d;
    try {
        const { tenantId } = await resolveBrandingAdminOperatorContext(req);
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        if (((_b = body.test) === null || _b === void 0 ? void 0 : _b.id) && ((_c = body.test) === null || _c === void 0 ? void 0 : _c.to)) {
            const result = await sendTestEmailIdentity(tenantId, body.test.id, body.test.to);
            return ok({ data: result });
        }
        const identity = (_d = body.identity) !== null && _d !== void 0 ? _d : body.patch;
        if (identity) {
            const row = await saveEmailIdentity(tenantId, Object.assign(Object.assign({}, identity), { tenant_id: tenantId }));
            return ok({ data: { identity: row } });
        }
        return Response.json({ error: "identity or test required" }, { status: 400 });
    }
    catch (err) {
        const j = jsonAdminError(err);
        if (j)
            return j;
        return serverError(err);
    }
}
