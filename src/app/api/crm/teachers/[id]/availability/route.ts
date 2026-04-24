import { NextRequest } from "next/server";
import {
  getTeacherWeeklyAvailability,
  setTeacherAvailability,
} from "@/lib/schedule/availability";
import { badRequest, ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// Day name → integer index (0=Sun, 1=Mon … 6=Sat)
const DAY_NAME_TO_INT: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

type RawSlot = {
  dayOfWeek: string | number;
  startTime: string;
  endTime: string;
  locationId?: string | null;
};
type PostBody = { slots: RawSlot[] };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read", "schedule.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: teacherId } = await ctx.params;
    const data = await getTeacherWeeklyAvailability(resolved.context.tenantId, teacherId);
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write", "schedule.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: teacherId } = await ctx.params;
    let body: PostBody | null = null;
    try {
      body = (await req.json()) as PostBody;
    } catch {
      return badRequest("INVALID_BODY");
    }
    if (!body || !Array.isArray(body.slots)) {
      return badRequest("INVALID_BODY", { expected: { slots: "array" } });
    }

    // Normalize slots: convert string day names → integer, pass locationId via notes
    const normalizedSlots = body.slots.map((s) => {
      const dayInt =
        typeof s.dayOfWeek === "number"
          ? s.dayOfWeek
          : DAY_NAME_TO_INT[String(s.dayOfWeek).toLowerCase()] ?? 1;
      return {
        dayOfWeek: dayInt,
        startTime: s.startTime,
        endTime: s.endTime,
        // Pass locationId via notes — our data layer reads it from there
        notes: s.locationId ?? "",
        locationId: s.locationId ?? "",
      };
    });

    const slots = await setTeacherAvailability(
      resolved.context.tenantId,
      teacherId,
      normalizedSlots,
    );
    return ok({ data: slots, count: slots.length });
  } catch (err) {
    return serverError(err);
  }
}
