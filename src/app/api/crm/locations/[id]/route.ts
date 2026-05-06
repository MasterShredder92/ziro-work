/**
 * GET /api/crm/locations/:id
 * Returns a single location record by ID, scoped to the tenant.
 * Called by family profile header and content to resolve primary_location_id → name/color.
 */
import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
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

    const db = getServiceClient();
    const { data, error } = await db
      .from("locations")
      .select("id, name, color, address, city, state, zip, phone, email, is_active, square_location_id, hours_json")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (error || !data) return notFound();

    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}
