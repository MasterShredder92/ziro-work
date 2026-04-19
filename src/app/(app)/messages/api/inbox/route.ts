import "server-only";
import type { NextRequest } from "next/server";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { getInbox } from "@/lib/messaging/service";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  void _req;
  try {
    const session = await requirePermission("messages.read")();
    await assertTenantAccess(session.tenantId);
    const data = await getInbox(session.userId);
    return ok({ data });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return badRequest("Forbidden");
    }
    return serverError(err);
  }
}
