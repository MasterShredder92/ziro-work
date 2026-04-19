import { NextRequest } from "next/server";
import {
  deleteScheduleRoom,
  getScheduleRoom,
  updateScheduleRoom,
} from "@data/scheduleRooms";
import type { ScheduleRoomUpdate } from "@/lib/schedule/types";
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
    const room = await getScheduleRoom(id, tenantId);
    if (!room) return notFound("ROOM_NOT_FOUND");
    return ok({ data: room });
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
    const body = await readJsonSafe<ScheduleRoomUpdate>(req);
    if (!body) return badRequest("INVALID_BODY");
    const room = await updateScheduleRoom(id, tenantId, body);
    await logAudit("schedule.rooms.update", {
      tenantId,
      profileId: session.userId,
      roomId: id,
    });
    return ok({ data: room });
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
    await deleteScheduleRoom(id, tenantId);
    await logAudit("schedule.rooms.delete", {
      tenantId,
      profileId: session.userId,
      roomId: id,
    });
    return noContent();
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
