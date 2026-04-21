import { createEventWithSideEffects, listEventsWithConflicts, } from "@/lib/schedule/service";
import { badRequest, created, ok, serverError, } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { conflict, forbidden, parseEventInput, readJsonSafe, resolveRequestedLocationId, withScheduleAccess, } from "../_utils";
import { assertLocationAllowed } from "@/lib/auth/locationAccess";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
        const url = new URL(req.url);
        const start = (_a = url.searchParams.get("start")) !== null && _a !== void 0 ? _a : undefined;
        const end = (_b = url.searchParams.get("end")) !== null && _b !== void 0 ? _b : undefined;
        const range = start && end ? { start, end } : undefined;
        const resolvedLocationId = resolveRequestedLocationId(req, locationAccess, {
            required: false,
            allowFallback: true,
        });
        const { events, conflicts } = await listEventsWithConflicts(tenantId, {
            range,
            teacherId: (_c = url.searchParams.get("teacherId")) !== null && _c !== void 0 ? _c : undefined,
            studentId: (_d = url.searchParams.get("studentId")) !== null && _d !== void 0 ? _d : undefined,
            familyId: (_e = url.searchParams.get("familyId")) !== null && _e !== void 0 ? _e : undefined,
            roomId: (_f = url.searchParams.get("roomId")) !== null && _f !== void 0 ? _f : undefined,
            locationId: resolvedLocationId !== null && resolvedLocationId !== void 0 ? resolvedLocationId : undefined,
            status: (_g = url.searchParams.get("status")) !== null && _g !== void 0 ? _g : undefined,
            kind: (_h = url.searchParams.get("kind")) !== null && _h !== void 0 ? _h : undefined,
            recurrenceId: (_j = url.searchParams.get("recurrenceId")) !== null && _j !== void 0 ? _j : undefined,
            limit: url.searchParams.get("limit")
                ? Number(url.searchParams.get("limit"))
                : undefined,
        });
        return ok({ data: events, conflicts, count: events.length });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const { session, tenantId, locationAccess } = await withScheduleAccess(req, "schedule.write");
        const body = await readJsonSafe(req);
        const parsed = parseEventInput(body);
        if (!parsed || !parsed.title || !parsed.startTime || !parsed.endTime) {
            return badRequest("INVALID_BODY", {
                expected: { title: "string", startTime: "ISO", endTime: "ISO" },
            });
        }
        const url = new URL(req.url);
        const allowConflict = url.searchParams.get("allowConflict") === "true" ||
            (body === null || body === void 0 ? void 0 : body.allowConflict) === true;
        const locationId = parsed.locationId
            ? assertLocationAllowed(locationAccess, parsed.locationId)
            : locationAccess.selectedLocationId;
        if (!locationId) {
            return badRequest("MISSING_LOCATION_ID");
        }
        try {
            const event = await createEventWithSideEffects(tenantId, {
                title: parsed.title,
                kind: (_a = parsed.kind) !== null && _a !== void 0 ? _a : "lesson",
                status: (_b = parsed.status) !== null && _b !== void 0 ? _b : "scheduled",
                teacherId: (_c = parsed.teacherId) !== null && _c !== void 0 ? _c : null,
                studentId: (_d = parsed.studentId) !== null && _d !== void 0 ? _d : null,
                familyId: (_e = parsed.familyId) !== null && _e !== void 0 ? _e : null,
                roomId: (_f = parsed.roomId) !== null && _f !== void 0 ? _f : null,
                locationId,
                startTime: parsed.startTime,
                endTime: parsed.endTime,
                notes: (_g = parsed.notes) !== null && _g !== void 0 ? _g : null,
                color: (_h = parsed.color) !== null && _h !== void 0 ? _h : null,
                recurrenceId: (_j = parsed.recurrenceId) !== null && _j !== void 0 ? _j : null,
                createdBy: session.userId,
            }, { allowConflict });
            await logAudit("schedule.events.create", {
                tenantId,
                profileId: session.userId,
                eventId: event.id,
            });
            return created({ data: event });
        }
        catch (err) {
            if (err instanceof Error && err.code === "SCHEDULE_CONFLICT") {
                return conflict({
                    conflicts: (_k = err.conflicts) !== null && _k !== void 0 ? _k : [],
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
