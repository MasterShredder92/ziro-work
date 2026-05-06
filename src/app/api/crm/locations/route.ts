/**
 * GET /api/crm/locations
 * Returns all locations for the tenant.
 * Called by add-student-modal and other places needing a location list.
 */
import { NextRequest } from "next/server";
import { listLocations } from "@data/locations";
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
    const locations = await listLocations(tenantId);
    return ok({ data: locations });
  } catch (err) {
    return serverError(err);
  }
}
