import "server-only";
import type { NextRequest } from "next/server";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { ok, serverError } from "@/lib/http";
import { getUnreadSummary } from "@/lib/messaging/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden() {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(_req: NextRequest) {
  void _req;
  try {
    const session = await requirePermission("messages.read")();
    await assertTenantAccess(session.tenantId);

    const summary = await getUnreadSummary(session.tenantId, session.userId);
    return ok({ data: summary });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
