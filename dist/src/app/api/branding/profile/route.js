import { getBrandingDashboard, getBrandingProfile, publishBrandingProfile, saveBrandingDraft, saveBrandingProfile, } from "@/lib/branding";
import { readJson, ok } from "@/lib/http";
import { handleError } from "@/app/api/admin/_handle";
import { logAudit } from "@/lib/audit/log";
import { resolveBrandingAdminOperatorContext, resolveBrandingProfileReadContext, } from "../_auth";
import { AdminApiError } from "@/app/api/admin/_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { session, tenantId } = await resolveBrandingProfileReadContext(req);
        const url = new URL(req.url);
        if (url.searchParams.get("view") === "dashboard") {
            const data = await getBrandingDashboard(tenantId);
            await logAudit("branding.dashboard.read", {
                tenantId,
                profileId: session.userId,
                role: session.role,
                source: "api",
            });
            return ok({ data });
        }
        const profile = await getBrandingProfile(tenantId);
        await logAudit("branding.profile.read", {
            tenantId,
            profileId: session.userId,
            role: session.role,
            source: "api",
        });
        return ok({ data: profile });
    }
    catch (err) {
        return handleError(err);
    }
}
export async function PATCH(req) {
    var _a, _b, _c;
    try {
        const { session, tenantId } = await resolveBrandingAdminOperatorContext(req);
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        if (body.publishId) {
            const updated = await publishBrandingProfile(tenantId, body.publishId, (_b = session.userId) !== null && _b !== void 0 ? _b : null);
            return ok({ data: updated });
        }
        if (body.draft && ((_c = body.patch) === null || _c === void 0 ? void 0 : _c.id)) {
            const updated = await saveBrandingDraft(tenantId, body.patch.id, body.draft);
            return ok({ data: updated });
        }
        if (!body.patch || typeof body.patch !== "object") {
            throw new AdminApiError("INVALID_BODY", 400);
        }
        const updated = await saveBrandingProfile(tenantId, body.patch);
        return ok({ data: updated });
    }
    catch (err) {
        return handleError(err);
    }
}
