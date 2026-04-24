import { NextRequest, NextResponse } from "next/server";
import {
  getTeacherWeeklyAvailability,
  setTeacherAvailability,
} from "@/lib/schedule/availability";
import { badRequest, ok } from "@/lib/http";
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
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[availability GET] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write", "schedule.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;

  let body: PostBody | null = null;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return badRequest("INVALID_BODY");
  }

  console.log("[availability POST] payload:", JSON.stringify(body));

  if (!body || !Array.isArray(body.slots)) {
    return badRequest("INVALID_BODY", { expected: { slots: "array" } });
  }

  try {
    const { id: teacherId } = await ctx.params;

    // Normalize slots: convert string day names → integer, pass locationId through both fields
    const normalizedSlots = body.slots.map((s) => {
      const dayInt =
        typeof s.dayOfWeek === "number"
          ? s.dayOfWeek
          : DAY_NAME_TO_INT[String(s.dayOfWeek).toLowerCase()] ?? 1;
      return {
        dayOfWeek: dayInt,
        startTime: s.startTime,
        endTime: s.endTime,
        locationId: s.locationId ?? "",
        notes: s.locationId ?? "",
      };
    });

    console.log("[availability POST] normalized:", JSON.stringify(normalizedSlots));

    const slots = await setTeacherAvailability(
      resolved.context.tenantId,
      teacherId,
      normalizedSlots,
    );

    console.log("[availability POST] saved:", slots.length, "slots");
    return ok({ data: slots, count: slots.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[availability POST] FAILED:", msg, err);
    // Surface the exact error — not a generic 500
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
