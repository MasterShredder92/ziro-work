import { NextRequest } from "next/server";
import { getTeacherDashboard } from "@/lib/teacher/service";
import { resolveTeacherContext } from "../../guard";
import { logAudit } from "@/lib/audit/log";
import { invokeSkill } from "@/lib/ziro/invokeSkill";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const explicit = url.searchParams.get("teacherId")?.trim() ?? "";
    const skillId = url.searchParams.get("skill")?.trim() ?? "";

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

    let automation: unknown = null;
    if (skillId.length > 0) {
      const result = await invokeSkill(skillId, {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        extra: { teacherId: ctx.teacherId },
      });
      automation = result;
      await logAudit("teacher.dashboard.automation", {
        teacherId: ctx.teacherId,
        tenantId: ctx.tenantId,
        skillId,
        ok: result.ok,
      });
    }

    return ok({ data, automation });
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
