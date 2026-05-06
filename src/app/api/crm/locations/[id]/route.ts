/**
 * GET /api/crm/locations/:id
 * Returns a single location record by ID, scoped to the tenant.
 * Called by family profile header and content to resolve primary_location_id → name/color.
 */
import { NextRequest } from "next/server";
import { getLocationById } from "@data/locations";
import { notFound, ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id } = await ctx.params;
    const { tenantId } = resolved.context;

    const location = await getLocationById(id, tenantId);
    if (!location) return notFound();

    return ok({ data: location });
  } catch (err) {
    return serverError(err);
  }
}
