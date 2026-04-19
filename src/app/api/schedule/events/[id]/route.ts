import { NextRequest } from "next/server";
import {
  cancelEvent,
  getEvent,
  updateEventWithSideEffects,
} from "@/lib/schedule/service";
import type { LessonEventUpdate } from "@/lib/schedule/types";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  serverError,
} from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  conflict,
  forbidden,
  parseEventInput,
  readJsonSafe,
  withScheduleAccess,
} from "../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await withScheduleAccess(req, "schedule.read");
    const { id } = await ctx.params;
    const event = await getEvent(tenantId, id);
    if (!event) return notFound("EVENT_NOT_FOUND");
    return ok({ data: event });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { session, tenantId } = await withScheduleAccess(
      req,
      "schedule.write",
    );
    const { id } = await ctx.params;
    const body = await readJsonSafe(req);
    const parsed = parseEventInput(body);
    if (!parsed) return badRequest("INVALID_BODY");

    const url = new URL(req.url);
    const allowConflict =
      url.searchParams.get("allowConflict") === "true" ||
      (body as Record<string, unknown>)?.allowConflict === true;

    try {
      const event = await updateEventWithSideEffects(
        tenantId,
        id,
        parsed as LessonEventUpdate,
        { allowConflict },
      );
      await logAudit("schedule.events.update", {
        tenantId,
        profileId: session.userId,
        eventId: event.id,
      });
      return ok({ data: event });
    } catch (err) {
      if (err instanceof Error && (err as { code?: string }).code === "SCHEDULE_CONFLICT") {
        return conflict({
          conflicts: (err as { conflicts?: unknown }).conflicts ?? [],
        });
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { session, tenantId } = await withScheduleAccess(
      req,
      "schedule.write",
    );
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const hardDelete = url.searchParams.get("hard") === "true";
    await cancelEvent(tenantId, id, { hardDelete });
    await logAudit("schedule.events.delete", {
      tenantId,
      profileId: session.userId,
      eventId: id,
      hardDelete,
    });
    return noContent();
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
