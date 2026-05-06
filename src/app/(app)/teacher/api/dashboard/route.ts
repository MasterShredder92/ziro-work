import { NextRequest } from "next/server";
import { getTeacherDashboard } from "@/lib/teacher/service";
import { resolveTeacherContext } from "../../guard";
import { logAudit } from "@/lib/audit/log";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const explicit = url.searchParams.get("teacherId")?.trim() ?? "";
    const ctx = await resolveTeacherContext({
      teacherId: explicit.length > 0 ? explicit : null,
    });

    const data = await getTeacherDashboard(ctx.teacherId);

    await logAudit("teacher.dashboard.view", {
      teacherId: ctx.teacherId,
      tenantId: ctx.tenantId,
      userId: ctx.session.userId,
      role: ctx.session.role,
    });

    return ok({ data });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "FORBIDDEN") {
        return badRequest("Forbidden");
      }
      if (err.message === "TEACHER_NOT_FOUND") {
        return badRequest("No teacher record found for this session.");
      }
    }
    return serverError(err);
  }
}
