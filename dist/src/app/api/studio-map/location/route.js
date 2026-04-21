import { badRequest, ok, serverError } from "@/lib/http";
import { resolveRequestedLocationId, withScheduleAccess } from "../../schedule/_utils";
import { clampWindowLength } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { computeOpenSlotsForWindow, projectBlocksForWindow, } from "@/lib/schedule/windowedClient";
function validIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
        const url = new URL(req.url);
        const start = url.searchParams.get("start");
        const end = url.searchParams.get("end");
        const locationId = resolveRequestedLocationId(req, locationAccess, {
            required: true,
            allowFallback: true,
        });
        if (!validIsoDate(start) || !validIsoDate(end)) {
            return badRequest("INVALID_WINDOW", {
                expected: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" },
            });
        }
        if (!locationId) {
            return badRequest("MISSING_LOCATION_ID");
        }
        if (!clampWindowLength({ start, end }, 14)) {
            return badRequest("WINDOW_TOO_LARGE", { maxDays: 14 });
        }
        const data = await loadWindowedScheduleData({
            tenantId,
            locationId,
            start,
            end,
            includeRooms: true,
            includeStudents: false,
        });
        const teacherIds = data.teachers.map((t) => t.id);
        const projected = projectBlocksForWindow(data.blocks, start, end);
        const openSlots = computeOpenSlotsForWindow({
            teacherIds,
            availability: data.availability,
            projectedBlocks: projected,
            start,
            end,
        });
        const payload = {
            start,
            end,
            locationId,
            teachers: data.teachers,
            blocks: data.blocks,
            availability: data.availability,
            rooms: data.rooms,
            stats: {
                teacherCount: data.teachers.length,
                roomCount: data.rooms.length,
                blockCount: projected.length,
                openSlotCount: openSlots.length,
            },
        };
        return ok(payload);
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
                status: 403,
                headers: { "content-type": "application/json" },
            });
        }
        return serverError(err);
    }
}
