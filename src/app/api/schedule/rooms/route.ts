import { NextRequest } from "next/server";
import {
  createScheduleRoom,
  listScheduleRooms,
} from "@data/scheduleRooms";
import type { ScheduleRoomInsert } from "@/lib/schedule/types";
import {
  badRequest,
  created,
  ok,
  serverError,
} from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  forbidden,
  readJsonSafe,
  resolveRequestedLocationId,
  withScheduleAccess,
} from "../_utils";
import { assertLocationAllowed } from "@/lib/auth/locationAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateRoomBody = Partial<ScheduleRoomInsert> & {
  name?: string;
  capacity?: number;
};

export async function GET(req: NextRequest) {
  try {
    const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
    const url = new URL(req.url);
    const activeParam = url.searchParams.get("active");
    const locationId = resolveRequestedLocationId(req, locationAccess, {
      required: false,
      allowFallback: true,
    });
    const rooms = await listScheduleRooms(tenantId, {
      location_id: locationId ?? undefined,
      room_type: url.searchParams.get("roomType") ?? undefined,
      is_active:
        activeParam === "true" ? true : activeParam === "false" ? false : undefined,
    });
    return ok({ data: rooms, count: rooms.length });
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
    const body = (await readJsonSafe<CreateRoomBody>(req)) ?? {};
    if (
      !body.name ||
      typeof body.capacity !== "number" ||
      !Number.isFinite(body.capacity)
    ) {
      return badRequest("INVALID_BODY", {
        expected: { name: "string", capacity: "number" },
      });
    }
    const locationId = body.locationId
      ? assertLocationAllowed(locationAccess, body.locationId)
      : locationAccess.selectedLocationId;
    if (!locationId) {
      return badRequest("MISSING_LOCATION_ID");
    }

    const room = await createScheduleRoom(tenantId, {
      tenantId,
      name: body.name,
      capacity: body.capacity,
      locationId,
      equipment: Array.isArray(body.equipment) ? body.equipment : [],
      roomType: body.roomType ?? null,
      bookingRules: body.bookingRules ?? null,
      isActive: body.isActive !== false,
    });
    await logAudit("schedule.rooms.create", {
      tenantId,
      profileId: session.userId,
      roomId: room.id,
    });
    return created({ data: room });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}
