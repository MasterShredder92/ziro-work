import { z } from "zod";
import { badRequest, created, ok, parseListQuery, readJson, resolveTenantId, } from "@/lib/http";
import { resolveAttendanceContext, respondAttendanceError, } from "@/lib/attendance/guard";
import { listAttendanceRecords, upsertAttendanceRecord, } from "@data/attendanceRecords";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
        const url = new URL(req.url);
        const filter = {
            session_id: (_a = url.searchParams.get("session_id")) !== null && _a !== void 0 ? _a : undefined,
            student_id: (_b = url.searchParams.get("student_id")) !== null && _b !== void 0 ? _b : undefined,
            teacher_id: (_c = url.searchParams.get("teacher_id")) !== null && _c !== void 0 ? _c : undefined,
            schedule_block_id: (_d = url.searchParams.get("schedule_block_id")) !== null && _d !== void 0 ? _d : undefined,
            status: (_e = url.searchParams.get("status")) !== null && _e !== void 0 ? _e : undefined,
            date_from: (_f = url.searchParams.get("date_from")) !== null && _f !== void 0 ? _f : undefined,
            date_to: (_g = url.searchParams.get("date_to")) !== null && _g !== void 0 ? _g : undefined,
        };
        const data = await listAttendanceRecords(filter, tenantId, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
const RecordCreateSchema = z.object({
    session_id: z.string().min(1),
    student_id: z.string().min(1),
    status: z.enum([
        "present",
        "absent",
        "tardy",
        "excused",
        "makeup",
        "no_show",
    ]),
    schedule_block_id: z.string().nullable().optional(),
    teacher_id: z.string().nullable().optional(),
    arrived_at: z.string().nullable().optional(),
    left_at: z.string().nullable().optional(),
    minutes_late: z.number().int().nullable().optional(),
    reason_id: z.string().nullable().optional(),
    reason_text: z.string().nullable().optional(),
    is_excused: z.boolean().optional(),
    marked_by: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
});
export async function POST(req) {
    var _a;
    try {
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");
        const body = await readJson(req);
        const parsed = RecordCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid attendance payload", parsed.error.flatten());
        }
        const row = await upsertAttendanceRecord(Object.assign(Object.assign({ tenant_id: tenantId }, parsed.data), { is_excused: (_a = parsed.data.is_excused) !== null && _a !== void 0 ? _a : parsed.data.status === "excused" }));
        return created({ data: row });
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
