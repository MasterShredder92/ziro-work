import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { noContent, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; locationId: string }> };

/**
 * DELETE /api/crm/teachers/[id]/locations/[locationId]
 * Removes a location assignment for the teacher.
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: teacherId, locationId } = await ctx.params;
    const db = getServiceClient();
    const { data, error } = await db
      .from("teacher_locations")
      .delete()
      .eq("teacher_id", teacherId)
      .eq("location_id", locationId)
      .select("id")
      .maybeSingle();
    if (error) return serverError(error);
    if (!data) return notFound();
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
