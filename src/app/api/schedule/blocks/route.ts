import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { resolveRequestedLocationId, withScheduleAccess } from "../_utils";
import { clampWindowLength } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";

function validIsoDate(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const locationId = resolveRequestedLocationId(req, locationAccess, {
      required: true,
      allowFallback: true,
    });

    if (!validIsoDate(start) || !validIsoDate(end)) {
      return badRequest("INVALID_WINDOW", {
        expected: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" },
      });
    }
    if (!locationId) {
      return badRequest("MISSING_LOCATION_ID");
    }
    if (!clampWindowLength({ start, end }, 14)) {
      return badRequest("WINDOW_TOO_LARGE", {
        maxDays: 14,
      });
    }

    const data = await loadWindowedScheduleData({
      tenantId,
      locationId,
      start,
      end,
      includeRooms: false,
    });

    return ok({
      start,
      end,
      locationId,
      blocks: data.blocks,
      count: data.blocks.length,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
    return serverError(err);
  }
}
