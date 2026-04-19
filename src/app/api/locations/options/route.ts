import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  void _req;

  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ data: [], tenantId: DEFAULT_TENANT_ID }, { status: 200 });
    }
    const access = await resolveUserLocationAccess({
      session,
      autoRepairProfileLocation: true,
    });
    return Response.json(
      { data: access.locations ?? [], tenantId: access.tenantId || DEFAULT_TENANT_ID },
      { status: 200 },
    );
  } catch {
    return Response.json({ data: [], tenantId: DEFAULT_TENANT_ID }, { status: 200 });
  }
}
