/**
 * GET /api/crm/locations
 * Returns all active locations for the tenant.
 * Called by add-student-modal and other places needing a location list.
 */
import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { tenantId } = resolved.context;

    const db = getServiceClient();
    const { data, error } = await db
      .from("locations")
      .select("id, name, color, address, city, state, zip, phone, email, is_active, square_location_id")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });

    if (error) return serverError(error);

    return ok({ data: data ?? [] });
  } catch (err) {
    return serverError(err);
  }
}
