import { requireRole } from "@/lib/auth/guards";
import { getFamilyProfile, resolveCurrentFamilyId, } from "@/lib/family/queries";
import { getFamilyDashboard } from "@/lib/family/service";
import { badRequest, ok, serverError } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c;
    try {
        const session = await requireRole("family")();
        const url = new URL(req.url);
        let familyId = (_b = (_a = url.searchParams.get("familyId")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        if (!familyId) {
            const resolved = await resolveCurrentFamilyId(session.userId, session.tenantId);
            if (!resolved) {
                const fallback = await getFamilyProfile(session.userId);
                familyId = (_c = fallback === null || fallback === void 0 ? void 0 : fallback.id) !== null && _c !== void 0 ? _c : "";
            }
            else {
                familyId = resolved;
            }
        }
        if (!familyId) {
            return badRequest("No family id available for current session");
        }
        const data = await getFamilyDashboard(familyId);
        return ok({ data });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return badRequest("Forbidden");
        }
        return serverError(err);
    }
}
