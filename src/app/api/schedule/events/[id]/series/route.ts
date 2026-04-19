import { NextRequest } from "next/server";
import { getEvent } from "@/lib/schedule/service";
import {
  cancelSeries,
  updateSeries,
} from "@/lib/schedule/recurrence";
import type {
  LessonEvent,
  RecurringRuleUpdate,
} from "@/lib/schedule/types";
import {
  badRequest,
  noContent,
  notFound,
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

type SeriesPatchBody = {
  fromTime?: string;
  rulePatch?: RecurringRuleUpdate;
  eventPatch?: Partial<
    Pick<
      LessonEvent,
      | "title"
      | "status"
      | "teacherId"
      | "studentId"
      | "roomId"
      | "locationId"
      | "familyId"
      | "notes"
      | "color"
      | "kind"
    >
  >;
};

async function resolveRecurrenceId(
  tenantId: string,
  eventId: string,
): Promise<string | null> {
  const event = await getEvent(tenantId, eventId);
  return event?.recurrenceId ?? null;
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
    const recurrenceId = await resolveRecurrenceId(tenantId, id);
    if (!recurrenceId) return notFound("RECURRENCE_NOT_FOUND");

    const body = (await readJsonSafe<SeriesPatchBody>(req)) ?? {};
    if (!body.rulePatch && !body.eventPatch) {
      return badRequest("INVALID_BODY", {
        expected: { rulePatch: "object?", eventPatch: "object?" },
      });
    }

    const result = await updateSeries(tenantId, recurrenceId, body);
    await logAudit("schedule.series.update", {
      tenantId,
      profileId: session.userId,
      recurrenceId,
      eventId: id,
      updatedCount: result.updatedCount,
    });
    return ok({ data: result });
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
    const recurrenceId = await resolveRecurrenceId(tenantId, id);
    if (!recurrenceId) return notFound("RECURRENCE_NOT_FOUND");

    const url = new URL(req.url);
    const fromTime = url.searchParams.get("fromTime") ?? undefined;
    const deleteRule = url.searchParams.get("deleteRule") === "true";

    const result = await cancelSeries(tenantId, recurrenceId, {
      fromTime,
      deleteRule,
    });
    await logAudit("schedule.series.cancel", {
      tenantId,
      profileId: session.userId,
      recurrenceId,
      eventId: id,
      removedCount: result.removedCount,
      ruleRemoved: result.ruleRemoved,
    });
    return noContent();
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
