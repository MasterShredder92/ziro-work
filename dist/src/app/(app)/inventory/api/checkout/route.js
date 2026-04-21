import { NextResponse } from "next/server";
import { badRequest, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { checkoutItem } from "@/lib/inventory/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        let session;
        try {
            session = await requirePermission("inventory.write")();
        }
        catch (_j) {
            return forbidden();
        }
        const body = await readJson(req);
        if (!body)
            return badRequest("Invalid body");
        if (!body.itemId)
            return badRequest("Missing itemId");
        if (!body.profileId)
            return badRequest("Missing profileId");
        const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const surface = await checkoutItem({
            itemId: body.itemId,
            profileId: body.profileId,
            tenantId,
            dueDate: (_b = body.dueDate) !== null && _b !== void 0 ? _b : null,
            quantity: body.quantity,
            studentId: (_c = body.studentId) !== null && _c !== void 0 ? _c : null,
            teacherId: (_d = body.teacherId) !== null && _d !== void 0 ? _d : null,
            locationId: (_e = body.locationId) !== null && _e !== void 0 ? _e : null,
            conditionAtCheckout: (_f = body.conditionAtCheckout) !== null && _f !== void 0 ? _f : null,
            notes: (_g = body.notes) !== null && _g !== void 0 ? _g : null,
            checkedOutBy: session.userId,
        });
        await logAudit("inventory.checkout.create", {
            tenantId,
            profileId: session.userId,
            itemId: body.itemId,
            checkoutProfileId: body.profileId,
            dueDate: (_h = body.dueDate) !== null && _h !== void 0 ? _h : null,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        if (err instanceof Error && err.message === "INVENTORY_ITEM_NOT_FOUND") {
            return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
        }
        return serverError(err);
    }
}
