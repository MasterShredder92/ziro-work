import { createScheduleRoom, listScheduleRooms, } from "@data/scheduleRooms";
import { badRequest, created, ok, serverError, } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { forbidden, readJsonSafe, resolveRequestedLocationId, withScheduleAccess, } from "../_utils";
import { assertLocationAllowed } from "@/lib/auth/locationAccess";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a;
    try {
        const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
        const url = new URL(req.url);
        const activeParam = url.searchParams.get("active");
        const locationId = resolveRequestedLocationId(req, locationAccess, {
            required: false,
            allowFallback: true,
        });
        const rooms = await listScheduleRooms(tenantId, {
            location_id: locationId !== null && locationId !== void 0 ? locationId : undefined,
            room_type: (_a = url.searchParams.get("roomType")) !== null && _a !== void 0 ? _a : undefined,
            is_active: activeParam === "true" ? true : activeParam === "false" ? false : undefined,
        });
        return ok({ data: rooms, count: rooms.length });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function POST(req) {
    var _a, _b, _c;
    try {
        const { session, tenantId, locationAccess } = await withScheduleAccess(req, "schedule.write");
        const body = (_a = (await readJsonSafe(req))) !== null && _a !== void 0 ? _a : {};
        if (!body.name ||
            typeof body.capacity !== "number" ||
            !Number.isFinite(body.capacity)) {
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
            roomType: (_b = body.roomType) !== null && _b !== void 0 ? _b : null,
            bookingRules: (_c = body.bookingRules) !== null && _c !== void 0 ? _c : null,
            isActive: body.isActive !== false,
        });
        await logAudit("schedule.rooms.create", {
            tenantId,
            profileId: session.userId,
            roomId: room.id,
        });
        return created({ data: room });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
