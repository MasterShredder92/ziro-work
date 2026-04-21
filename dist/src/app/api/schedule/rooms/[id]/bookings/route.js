import { assignRoomToEvent } from "@/lib/schedule/bookings";
import { listRoomBookings } from "@data/roomBookings";
import { badRequest, created, ok, serverError, } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { conflict, forbidden, readJsonSafe, withScheduleAccess, } from "../../../_utils";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    var _a, _b;
    try {
        const { tenantId } = await withScheduleAccess(req, "schedule.read");
        const { id } = await ctx.params;
        const url = new URL(req.url);
        const bookings = await listRoomBookings(tenantId, {
            room_id: id,
            start_from: (_a = url.searchParams.get("start")) !== null && _a !== void 0 ? _a : undefined,
            start_to: (_b = url.searchParams.get("end")) !== null && _b !== void 0 ? _b : undefined,
        }, { limit: 1000 });
        return ok({ data: bookings, count: bookings.length });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function POST(req, ctx) {
    var _a, _b, _c;
    try {
        const { session, tenantId } = await withScheduleAccess(req, "schedule.write");
        const { id } = await ctx.params;
        const body = (_a = (await readJsonSafe(req))) !== null && _a !== void 0 ? _a : {
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
                bookedBy: (_b = session.userId) !== null && _b !== void 0 ? _b : null,
            });
            await logAudit("schedule.rooms.book", {
                tenantId,
                profileId: session.userId,
                roomId: id,
                eventId: body.eventId,
                bookingId: result.booking.id,
            });
            return created({ data: result });
        }
        catch (err) {
            if (err instanceof Error &&
                err.code === "SCHEDULE_CONFLICT") {
                return conflict({
                    conflicts: (_c = err.conflicts) !== null && _c !== void 0 ? _c : [],
                });
            }
            throw err;
        }
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
