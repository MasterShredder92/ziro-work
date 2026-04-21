import { z } from "zod";
import { createSessionLog, getSessionLogByBlockId, listSessionLog, } from "@data/sessionLog";
import { getScheduleBlockById } from "@data/scheduleBlocks";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { badRequest, created, ok, parseListQuery, readJson, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const session = await requirePermission("schedule.read")();
        const tenantId = session.tenantId;
        const url = new URL(req.url);
        const requestedLocationId = (_a = url.searchParams.get("location_id")) !== null && _a !== void 0 ? _a : url.searchParams.get("locationId");
        const access = await resolveUserLocationAccess({
            session,
            preferredLocationId: requestedLocationId,
            autoRepairProfileLocation: true,
        });
        const resolvedLocationId = requestedLocationId
            ? assertLocationAllowed(access, requestedLocationId)
            : access.selectedLocationId;
        const filter = {
            student_id: (_b = url.searchParams.get("student_id")) !== null && _b !== void 0 ? _b : undefined,
            teacher_id: (_c = url.searchParams.get("teacher_id")) !== null && _c !== void 0 ? _c : undefined,
            schedule_block_id: (_d = url.searchParams.get("schedule_block_id")) !== null && _d !== void 0 ? _d : undefined,
            location_id: resolvedLocationId !== null && resolvedLocationId !== void 0 ? resolvedLocationId : undefined,
            status: (_e = url.searchParams.get("status")) !== null && _e !== void 0 ? _e : undefined,
            date_from: (_f = url.searchParams.get("date_from")) !== null && _f !== void 0 ? _f : undefined,
            date_to: (_g = url.searchParams.get("date_to")) !== null && _g !== void 0 ? _g : undefined,
        };
        const data = await listSessionLog(tenantId, filter, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const SessionLogCreateSchema = z
    .object({
    schedule_block_id: z.string().uuid(),
    student_id: z.string().uuid(),
    teacher_id: z.string().uuid(),
    location_id: z.string().uuid(),
    block_date: z.string(),
    student_rate: z.number(),
    teacher_rate: z.number(),
    status: z.string().optional(),
    lesson_notes: z.string().nullable().optional(),
    teacher_note: z.string().nullable().optional(),
    engagement_level: z.number().int().min(1).max(5).nullable().optional(),
    progress_indicator: z.string().nullable().optional(),
    worked_on: z.array(z.string()).nullable().optional(),
    instrument: z.string().nullable().optional(),
    ai_summary: z.string().nullable().optional(),
    voice_note_url: z.string().nullable().optional(),
    payment_gated: z.boolean().optional(),
})
    .passthrough();
export async function POST(req) {
    try {
        const session = await requirePermission("schedule.write")();
        const tenantId = session.tenantId;
        const body = await readJson(req);
        const parsed = SessionLogCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid session_log payload", parsed.error.flatten());
        }
        const block = await getScheduleBlockById(parsed.data.schedule_block_id, tenantId);
        if (!block)
            return badRequest("schedule_block not found");
        const access = await resolveUserLocationAccess({
            session,
            preferredLocationId: block.location_id,
            autoRepairProfileLocation: true,
        });
        const locationId = assertLocationAllowed(access, block.location_id);
        if (!locationId || locationId !== block.location_id) {
            return badRequest("Location access denied");
        }
        if (parsed.data.location_id !== block.location_id) {
            return badRequest("session_log location_id must match schedule block location");
        }
        if (parsed.data.student_id !== block.student_id) {
            return badRequest("session_log student_id must match schedule block student");
        }
        if (parsed.data.teacher_id !== block.teacher_id) {
            return badRequest("session_log teacher_id must match schedule block teacher");
        }
        if (parsed.data.block_date !== block.block_date) {
            return badRequest("session_log block_date must match schedule block date");
        }
        const existing = await getSessionLogByBlockId(block.id, tenantId).catch(() => null);
        if (existing === null || existing === void 0 ? void 0 : existing.id) {
            return ok({ data: existing });
        }
        const row = await createSessionLog(tenantId, parsed.data);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
