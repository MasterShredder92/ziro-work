import { searchCRM } from "@/lib/crm";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b;
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read"],
        minRole: "student",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const url = new URL(req.url);
        const term = (_a = url.searchParams.get("q")) !== null && _a !== void 0 ? _a : "";
        const includeArchived = url.searchParams.get("includeArchived") === "true";
        const limitParam = Number((_b = url.searchParams.get("limit")) !== null && _b !== void 0 ? _b : "50");
        const limit = Number.isFinite(limitParam)
            ? Math.min(Math.max(limitParam, 1), 200)
            : 50;
        const type = url.searchParams.get("type");
        const result = await searchCRM(resolved.context.tenantId, term, {
            includeArchived,
            limit,
        });
        if (type === "contact") {
            return ok({ contacts: result.contacts });
        }
        return ok(result);
    }
    catch (err) {
        return serverError(err);
    }
}
