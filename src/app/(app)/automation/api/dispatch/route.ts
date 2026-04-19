import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { dispatchAutomationEvent } from "@/lib/automation/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

type DispatchBody = {
  event?: string;
  data?: Record<string, unknown>;
  profileId?: string;
  conversationId?: string;
  locationId?: string;
  occurredAt?: string;
  tenantId?: string;
};

export async function POST(req: NextRequest) {
  try {
    let session;
    try {
      session = await requirePermission("automation.write")();
    } catch {
      return forbidden();
    }

    const body = await readJson<DispatchBody>(req);
    if (!body || typeof body.event !== "string" || !body.event.trim()) {
      return badRequest("'event' is required.");
    }

    const tenantId = session.tenantId || body.tenantId || resolveTenantId(req);
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return forbidden("TENANT_MISMATCH");
    }

    const executions = await dispatchAutomationEvent(body.event.trim(), {
      tenantId,
      profileId: body.profileId ?? session.userId,
      conversationId: body.conversationId,
      locationId: body.locationId,
      data: body.data,
      occurredAt: body.occurredAt,
    });

    await logAudit("automation.api.dispatch", {
      tenantId,
      profileId: session.userId,
      event: body.event,
      executionCount: executions.length,
      ok: executions.every((e) => e.ok),
    });

    return ok({ data: { executions } });
  } catch (err) {
    return serverError(err);
  }
}
