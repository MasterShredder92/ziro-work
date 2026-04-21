import { NextResponse } from "next/server";
import { badRequest, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { returnItem } from "@/lib/inventory/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req) {
    var _a, _b, _c;
    try {
        let session;
        try {
            session = await requirePermission("inventory.write")();
        }
        catch (_d) {
            return forbidden();
        }
        const body = await readJson(req);
        if (!body)
            return badRequest("Invalid body");
        if (!body.checkoutId)
            return badRequest("Missing checkoutId");
        const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const surface = await returnItem(body.checkoutId, tenantId, {
            conditionAtReturn: (_b = body.conditionAtReturn) !== null && _b !== void 0 ? _b : null,
            notes: (_c = body.notes) !== null && _c !== void 0 ? _c : null,
            returnedBy: session.userId,
        });
        await logAudit("inventory.checkout.return", {
            tenantId,
            profileId: session.userId,
            checkoutId: body.checkoutId,
            itemId: surface.item.id,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        if (err instanceof Error &&
            (err.message === "INVENTORY_CHECKOUT_NOT_FOUND" ||
                err.message === "INVENTORY_ITEM_NOT_FOUND")) {
            return NextResponse.json({ error: "Inventory record not found" }, { status: 404 });
        }
        return serverError(err);
    }
}
