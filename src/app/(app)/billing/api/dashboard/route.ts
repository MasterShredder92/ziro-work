import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getBillingDashboard } from "@/lib/billing/service";
import type { BillingDashboardData } from "@/lib/billing/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET() {
  try {
    let session;
    try {
      session = await requirePermission("billing.read")();
    } catch {
      return forbidden();
    }

    try {
      await assertTenantAccess(session.tenantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "TENANT_MISMATCH";
      return forbidden(message);
    }

    const data: BillingDashboardData = await getBillingDashboard(
      session.tenantId,
    );
    return ok(data);
  } catch (err) {
    return serverError(err);
  }
}
