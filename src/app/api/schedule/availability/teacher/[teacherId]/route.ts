import { NextRequest } from "next/server";
import {
  getTeacherWeeklyAvailability,
  setTeacherAvailability,
} from "@/lib/schedule/availability";
import type { TeacherAvailabilityInsert } from "@/lib/schedule/types";
import {
  badRequest,
  ok,
  serverError,
} from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  forbidden,
  readJsonSafe,
  withScheduleAccess,
} from "../../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AvailabilitySlotInput = Omit<
  TeacherAvailabilityInsert,
  "tenantId" | "teacherId"
>;

type PostBody = {
  slots: AvailabilitySlotInput[];
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ teacherId: string }> },
) {
  try {
    const { tenantId } = await withScheduleAccess(req, "schedule.read");
    const { teacherId } = await ctx.params;
    const data = await getTeacherWeeklyAvailability(tenantId, teacherId);
    return ok({ data });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ teacherId: string }> },
) {
  try {
    const { session, tenantId } = await withScheduleAccess(
      req,
      "schedule.write",
    );
    const { teacherId } = await ctx.params;
    const body = await readJsonSafe<PostBody>(req);
    if (!body || !Array.isArray(body.slots)) {
      return badRequest("INVALID_BODY", {
        expected: { slots: "array" },
      });
    }
    const slots = await setTeacherAvailability(tenantId, teacherId, body.slots);
    await logAudit("schedule.availability.set", {
      tenantId,
      profileId: session.userId,
      teacherId,
      slotCount: slots.length,
    });
    return ok({ data: slots, count: slots.length });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
