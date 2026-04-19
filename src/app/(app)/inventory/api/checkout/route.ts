import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { checkoutItem } from "@/lib/inventory/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type CheckoutPayload = {
  itemId?: string;
  profileId?: string;
  dueDate?: string | null;
  quantity?: number;
  studentId?: string | null;
  teacherId?: string | null;
  locationId?: string | null;
  conditionAtCheckout?: string | null;
  notes?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("inventory.write")();
    } catch {
      return forbidden();
    }

    const body = await readJson<CheckoutPayload>(req);
    if (!body) return badRequest("Invalid body");
    if (!body.itemId) return badRequest("Missing itemId");
    if (!body.profileId) return badRequest("Missing profileId");

    const tenantId = session.tenantId ?? resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const surface = await checkoutItem({
      itemId: body.itemId,
      profileId: body.profileId,
      tenantId,
      dueDate: body.dueDate ?? null,
      quantity: body.quantity,
      studentId: body.studentId ?? null,
      teacherId: body.teacherId ?? null,
      locationId: body.locationId ?? null,
      conditionAtCheckout: body.conditionAtCheckout ?? null,
      notes: body.notes ?? null,
      checkedOutBy: session.userId,
    });

    await logAudit("inventory.checkout.create", {
      tenantId,
      profileId: session.userId,
      itemId: body.itemId,
      checkoutProfileId: body.profileId,
      dueDate: body.dueDate ?? null,
      source: "api",
    });

    return ok({ data: surface });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    if (err instanceof Error && err.message === "INVENTORY_ITEM_NOT_FOUND") {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 },
      );
    }
    return serverError(err);
  }
}
