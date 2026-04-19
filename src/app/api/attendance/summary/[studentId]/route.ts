import { NextRequest } from "next/server";
import { ok, resolveTenantId } from "@/lib/http";
import {
  resolveAttendanceContext,
  respondAttendanceError,
} from "@/lib/attendance/guard";
import { getStudentAttendanceSummary } from "@/lib/attendance/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ studentId: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { studentId } = await ctx.params;
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
    const url = new URL(req.url);
    const start = url.searchParams.get("start") ?? undefined;
    const end = url.searchParams.get("end") ?? undefined;
    const range = start && end ? { start, end } : undefined;
    const data = await getStudentAttendanceSummary(studentId, tenantId, range);
    return ok({ data });
  } catch (err) {
    return respondAttendanceError(err);
  }
}
