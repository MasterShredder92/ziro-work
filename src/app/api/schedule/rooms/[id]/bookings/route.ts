import { NextRequest } from "next/server";
import { assignRoomToEvent } from "@/lib/schedule/bookings";
import { listRoomBookings } from "@data/roomBookings";
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
  readJsonSafe,
  withScheduleAccess,
} from "../../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBookingBody = {
  eventId: string;
  allowConflict?: boolean;
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await withScheduleAccess(req, "schedule.read");
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const bookings = await listRoomBookings(
      tenantId,
      {
        room_id: id,
        start_from: url.searchParams.get("start") ?? undefined,
        start_to: url.searchParams.get("end") ?? undefined,
      },
      { limit: 1000 },
    );
    return ok({ data: bookings, count: bookings.length });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { session, tenantId } = await withScheduleAccess(
      req,
      "schedule.write",
    );
    const { id } = await ctx.params;
    const body = (await readJsonSafe<CreateBookingBody>(req)) ?? {
      eventId: "",
    };
    if (!body.eventId || typeof body.eventId !== "string") {
      return badRequest("INVALID_BODY", {
        expected: { eventId: "string" },
      });
    }
    try {
      const result = await assignRoomToEvent(tenantId, body.eventId, id, {
        allowConflict: body.allowConflict === true,
        bookedBy: session.userId ?? null,
      });
      await logAudit("schedule.rooms.book", {
        tenantId,
        profileId: session.userId,
        roomId: id,
        eventId: body.eventId,
        bookingId: result.booking.id,
      });
      return created({ data: result });
    } catch (err) {
      if (
        err instanceof Error &&
        (err as { code?: string }).code === "SCHEDULE_CONFLICT"
      ) {
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
