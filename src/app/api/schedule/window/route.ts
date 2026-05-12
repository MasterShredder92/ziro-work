import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/schedule/window
 *
 * Returns the same payload shape as server-side `loadWindowedScheduleData`
 * for a single location and date range — used to keep the client in sync
 * when the visible week changes.
 *
 * Query: locationId (uuid), start (YYYY-MM-DD), end (YYYY-MM-DD)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("schedule.read")();
    const tenantId = session.tenantId;
    const url = new URL(req.url);
    const locationId =
      url.searchParams.get("locationId") ?? url.searchParams.get("location_id");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    if (!locationId?.trim()) {
      return badRequest("locationId is required");
    }
    if (!start || !end || !ISO_DATE.test(start) || !ISO_DATE.test(end)) {
      return badRequest("start and end are required (YYYY-MM-DD)");
    }

    const data = await loadWindowedScheduleData({
      tenantId,
      locationId: locationId.trim(),
      start,
      end,
      includeRooms: true,
      includeStudents: true,
    });

    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}
