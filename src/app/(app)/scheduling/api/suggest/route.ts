import { NextRequest, NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { suggestSchedule } from "@/lib/scheduling/queries";
import { resolveSchedulingContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantParam = url.searchParams.get("tenantId")?.trim() || null;
    const teacherId = url.searchParams.get("teacherId")?.trim() || undefined;
    const studentId = url.searchParams.get("studentId")?.trim() || undefined;
    const roomId = url.searchParams.get("roomId")?.trim() || undefined;
    const durationRaw = url.searchParams.get("duration")?.trim();
    const start = url.searchParams.get("start")?.trim();
    const end = url.searchParams.get("end")?.trim();
    const limitRaw = url.searchParams.get("limit")?.trim();

    let ctx;
    try {
      ctx = await resolveSchedulingContext({ tenantId: tenantParam });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const duration = Number(durationRaw ?? "30");
    if (!Number.isFinite(duration) || duration <= 0 || duration > 480) {
      return badRequest("duration must be between 1 and 480 minutes.");
    }

    if ((start && !end) || (!start && end)) {
      return badRequest("Provide both start and end, or neither.");
    }

    const range = start && end ? { start, end } : undefined;
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const suggestions = await suggestSchedule(ctx.tenantId, {
      teacherId,
      studentId,
      roomId,
      duration,
      range,
      limit: Number.isFinite(limit) && limit ? Math.min(50, Number(limit)) : undefined,
    });

    await logAudit("scheduling.suggest.view", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      teacherId: teacherId ?? null,
      studentId: studentId ?? null,
      roomId: roomId ?? null,
      duration,
      rangeStart: range?.start ?? null,
      rangeEnd: range?.end ?? null,
      returned: suggestions.length,
    });

    return ok({
      tenantId: ctx.tenantId,
      duration,
      teacherId: teacherId ?? null,
      studentId: studentId ?? null,
      roomId: roomId ?? null,
      range: range ?? null,
      suggestions,
    });
  } catch (err) {
    return serverError(err);
  }
}
