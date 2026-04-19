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
import { logMaintenance } from "@/lib/inventory/service";
import type {
  InventoryMaintenanceKind,
  InventoryMaintenanceStatus,
} from "@/lib/inventory/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type MaintenancePayload = {
  itemId?: string;
  payload?: {
    summary?: string;
    kind?: InventoryMaintenanceKind;
    status?: InventoryMaintenanceStatus;
    notes?: string | null;
    cost?: number | null;
    vendor?: string | null;
    performedBy?: string | null;
    scheduledFor?: string | null;
    performedAt?: string | null;
    completedAt?: string | null;
    nextDueAt?: string | null;
  };
};

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("inventory.write")();
    } catch {
      return forbidden();
    }

    const body = await readJson<MaintenancePayload>(req);
    if (!body) return badRequest("Invalid body");
    if (!body.itemId) return badRequest("Missing itemId");
    if (!body.payload) return badRequest("Missing payload");
    if (!body.payload.summary || !body.payload.summary.trim())
      return badRequest("Missing summary");

    const tenantId = session.tenantId ?? resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const surface = await logMaintenance(body.itemId, {
      tenantId,
      summary: body.payload.summary,
      kind: body.payload.kind,
      status: body.payload.status,
      notes: body.payload.notes ?? null,
      cost: body.payload.cost ?? null,
      vendor: body.payload.vendor ?? null,
      performedBy: body.payload.performedBy ?? null,
      scheduledFor: body.payload.scheduledFor ?? null,
      performedAt: body.payload.performedAt ?? null,
      completedAt: body.payload.completedAt ?? null,
      nextDueAt: body.payload.nextDueAt ?? null,
      createdBy: session.userId,
    });

    await logAudit("inventory.maintenance.log", {
      tenantId,
      profileId: session.userId,
      itemId: body.itemId,
      status: body.payload.status ?? null,
      kind: body.payload.kind ?? null,
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
