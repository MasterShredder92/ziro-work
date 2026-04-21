import { NextResponse } from "next/server";
import { notFound, ok, resolveTenantId, serverError } from "@/lib/http";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getInventoryItemSurface } from "@/lib/inventory/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        let session;
        try {
            session = await requirePermission("inventory.read")();
        }
        catch (_b) {
            return forbidden();
        }
        const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const surface = await getInventoryItemSurface(id, tenantId);
        if (!surface)
            return notFound("Inventory item not found");
        try {
            await assertTenantAccess(surface.tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        await logAudit("inventory.surface.fetch", {
            tenantId: surface.tenantId,
            itemId: id,
            profileId: session.userId,
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
