import "server-only";
import type { NextRequest } from "next/server";
import { listLocations } from "@/lib/locations/queries";
import { resolveLocationsContext } from "../../guard";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  void _req;
  try {
    const { tenantId } = await resolveLocationsContext();
    const locations = await listLocations(tenantId);
    return ok({ data: locations });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return badRequest("Forbidden");
    }
    return serverError(err);
  }
}
