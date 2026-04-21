import { badRequest, ok, serverError } from "@/lib/http";
import { withScheduleAccess } from "../../schedule/_utils";
import { assertLocationAllowed } from "@/lib/auth/locationAccess";
import { clampWindowLength } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { projectBlocksForWindow } from "@/lib/schedule/windowedClient";
import { getServiceClient } from "@/lib/supabase";
function validIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
function mapStatus(raw) {
    const s = raw.trim().toLowerCase();
    if (s === "active" || s === "paused" || s === "inactive")
        return s;
    if (s === "enrolled" || s === "prospect" || s === "trial")
        return "active";
    return "inactive";
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d;
    try {
        const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
        const url = new URL(req.url);
        const start = url.searchParams.get("start");
        const end = url.searchParams.get("end");
        const teacherId = (_b = (_a = url.searchParams.get("teacherId")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
        const locationIdParam = (_d = (_c = url.searchParams.get("locationId")) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
        if (!validIsoDate(start) || !validIsoDate(end)) {
            return badRequest("INVALID_WINDOW");
        }
        if (!clampWindowLength({ start, end }, 14)) {
            return badRequest("WINDOW_TOO_LARGE", { maxDays: 14 });
        }
        if (!teacherId) {
            return badRequest("MISSING_TEACHER_ID");
        }
        const locationId = assertLocationAllowed(locationAccess, locationIdParam || null);
        if (!locationId) {
            return badRequest("MISSING_LOCATION_ID");
        }
        const data = await loadWindowedScheduleData({
            tenantId,
            locationId,
            start,
            end,
            includeRooms: false,
            includeStudents: false,
        });
        const projected = projectBlocksForWindow(data.blocks, start, end);
        const studentIds = new Set();
        for (const b of projected) {
            if (b.teacher_id !== teacherId)
                continue;
            if (!b.student_id)
                continue;
            if (b.block_type === "open_time")
                continue;
            if (b.block_type === "call_out" || b.callout_id || b.is_family_callout)
                continue;
            studentIds.add(b.student_id);
        }
        if (studentIds.size === 0) {
            return ok({ students: [] });
        }
        const supabase = getServiceClient();
        const { data: rows, error } = await supabase
            .from("students")
            .select("id, first_name, last_name, status")
            .eq("tenant_id", tenantId)
            .in("id", [...studentIds]);
        if (error)
            throw new Error(error.message);
        const students = (rows !== null && rows !== void 0 ? rows : []).map((row) => {
            var _a, _b, _c;
            const name = `${(_a = row.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = row.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || "Student";
            return {
                id: row.id,
                name,
                status: mapStatus((_c = row.status) !== null && _c !== void 0 ? _c : "inactive"),
            };
        });
        students.sort((a, b) => a.name.localeCompare(b.name));
        return ok({ students });
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
