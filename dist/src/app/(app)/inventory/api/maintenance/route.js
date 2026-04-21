import { NextResponse } from "next/server";
import { badRequest, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { logMaintenance } from "@/lib/inventory/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        let session;
        try {
            session = await requirePermission("inventory.write")();
        }
        catch (_m) {
            return forbidden();
        }
        const body = await readJson(req);
        if (!body)
            return badRequest("Invalid body");
        if (!body.itemId)
            return badRequest("Missing itemId");
        if (!body.payload)
            return badRequest("Missing payload");
        if (!body.payload.summary || !body.payload.summary.trim())
            return badRequest("Missing summary");
        const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
            return forbidden(message);
        }
        const surface = await logMaintenance(body.itemId, {
            tenantId,
            summary: body.payload.summary,
            kind: body.payload.kind,
            status: body.payload.status,
            notes: (_b = body.payload.notes) !== null && _b !== void 0 ? _b : null,
            cost: (_c = body.payload.cost) !== null && _c !== void 0 ? _c : null,
            vendor: (_d = body.payload.vendor) !== null && _d !== void 0 ? _d : null,
            performedBy: (_e = body.payload.performedBy) !== null && _e !== void 0 ? _e : null,
            scheduledFor: (_f = body.payload.scheduledFor) !== null && _f !== void 0 ? _f : null,
            performedAt: (_g = body.payload.performedAt) !== null && _g !== void 0 ? _g : null,
            completedAt: (_h = body.payload.completedAt) !== null && _h !== void 0 ? _h : null,
            nextDueAt: (_j = body.payload.nextDueAt) !== null && _j !== void 0 ? _j : null,
            createdBy: session.userId,
        });
        await logAudit("inventory.maintenance.log", {
            tenantId,
            profileId: session.userId,
            itemId: body.itemId,
            status: (_k = body.payload.status) !== null && _k !== void 0 ? _k : null,
            kind: (_l = body.payload.kind) !== null && _l !== void 0 ? _l : null,
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
