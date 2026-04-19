import { NextRequest } from "next/server";
import {
  createEventWithSideEffects,
  listEventsWithConflicts,
} from "@/lib/schedule/service";
import type {
  LessonEventInsert,
  LessonEventKind,
  LessonEventStatus,
} from "@/lib/schedule/types";
import {
  badRequest,
  created,
  ok,
  serverError,
} from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  conflict,
  forbidden,
  parseEventInput,
  readJsonSafe,
  resolveRequestedLocationId,
  withScheduleAccess,
} from "../_utils";
import { assertLocationAllowed } from "@/lib/auth/locationAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
    const url = new URL(req.url);
    const start = url.searchParams.get("start") ?? undefined;
    const end = url.searchParams.get("end") ?? undefined;
    const range =
      start && end ? { start, end } : undefined;

    const resolvedLocationId = resolveRequestedLocationId(req, locationAccess, {
      required: false,
      allowFallback: true,
    });

    const { events, conflicts } = await listEventsWithConflicts(tenantId, {
      range,
      teacherId: url.searchParams.get("teacherId") ?? undefined,
      studentId: url.searchParams.get("studentId") ?? undefined,
      familyId: url.searchParams.get("familyId") ?? undefined,
      roomId: url.searchParams.get("roomId") ?? undefined,
      locationId: resolvedLocationId ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      kind: url.searchParams.get("kind") ?? undefined,
      recurrenceId: url.searchParams.get("recurrenceId") ?? undefined,
      limit: url.searchParams.get("limit")
        ? Number(url.searchParams.get("limit"))
        : undefined,
    });
    return ok({ data: events, conflicts, count: events.length });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, tenantId, locationAccess } = await withScheduleAccess(
      req,
      "schedule.write",
    );
    const body = await readJsonSafe(req);
    const parsed = parseEventInput(body);
    if (!parsed || !parsed.title || !parsed.startTime || !parsed.endTime) {
      return badRequest("INVALID_BODY", {
        expected: { title: "string", startTime: "ISO", endTime: "ISO" },
      });
    }
    const url = new URL(req.url);
    const allowConflict =
      url.searchParams.get("allowConflict") === "true" ||
      (body as Record<string, unknown>)?.allowConflict === true;

    const locationId = parsed.locationId
      ? assertLocationAllowed(locationAccess, parsed.locationId)
      : locationAccess.selectedLocationId;
    if (!locationId) {
      return badRequest("MISSING_LOCATION_ID");
    }

    try {
      const event = await createEventWithSideEffects(
        tenantId,
        {
          title: parsed.title,
          kind: (parsed.kind as LessonEventKind) ?? "lesson",
          status: (parsed.status as LessonEventStatus) ?? "scheduled",
          teacherId: parsed.teacherId ?? null,
          studentId: parsed.studentId ?? null,
          familyId: parsed.familyId ?? null,
          roomId: parsed.roomId ?? null,
          locationId,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          notes: parsed.notes ?? null,
          color: parsed.color ?? null,
          recurrenceId: parsed.recurrenceId ?? null,
          createdBy: session.userId,
        } satisfies Omit<LessonEventInsert, "tenantId">,
        { allowConflict },
      );
      await logAudit("schedule.events.create", {
        tenantId,
        profileId: session.userId,
        eventId: event.id,
      });
      return created({ data: event });
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
