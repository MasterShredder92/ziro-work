import { z } from "zod";
import { createScheduleBlock, findConflictingBlocks, listScheduleBlocks, } from "@data/scheduleBlocks";
import { createSessionLog, getSessionLogByBlockId } from "@data/sessionLog";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { validateSubCoverage } from "@/lib/schedule/subCoverageIntegrity";
import { validateTeacherLocationAssignment } from "@/lib/schedule/teacherAssignmentIntegrity";
import { badRequest, created, ok, parseListQuery, readJson, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BlockTypeSchema = z.enum([
    "open_time",
    "student_session",
    "first_day",
    "last_day",
    "not_bookable",
    "sub",
    "call_out",
    "meet_greet",
    "teacher_training",
    "makeup_session",
    "virtual",
]);
const BlockStatusSchema = z.enum(["available", "booked"]);
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const session = await requirePermission("schedule.read")();
        const tenantId = session.tenantId;
        const url = new URL(req.url);
        const requestedLocationId = (_a = url.searchParams.get("location_id")) !== null && _a !== void 0 ? _a : url.searchParams.get("locationId");
        const locationAccess = await resolveUserLocationAccess({
            session,
            preferredLocationId: requestedLocationId,
            autoRepairProfileLocation: true,
        });
        const resolvedLocationId = requestedLocationId
            ? assertLocationAllowed(locationAccess, requestedLocationId)
            : locationAccess.selectedLocationId;
        const filter = {
            teacher_id: (_b = url.searchParams.get("teacher_id")) !== null && _b !== void 0 ? _b : undefined,
            student_id: (_c = url.searchParams.get("student_id")) !== null && _c !== void 0 ? _c : undefined,
            location_id: resolvedLocationId !== null && resolvedLocationId !== void 0 ? resolvedLocationId : undefined,
            room_id: (_d = url.searchParams.get("room_id")) !== null && _d !== void 0 ? _d : undefined,
            block_type: (_e = url.searchParams.get("block_type")) !== null && _e !== void 0 ? _e : undefined,
            status: (_f = url.searchParams.get("status")) !== null && _f !== void 0 ? _f : undefined,
            date_from: (_g = url.searchParams.get("date_from")) !== null && _g !== void 0 ? _g : undefined,
            date_to: (_h = url.searchParams.get("date_to")) !== null && _h !== void 0 ? _h : undefined,
        };
        const recurring = url.searchParams.get("is_recurring");
        if (recurring === "true")
            filter.is_recurring = true;
        else if (recurring === "false")
            filter.is_recurring = false;
        const data = await listScheduleBlocks(tenantId, filter, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const BlockCreateSchema = z
    .object({
    block_date: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    teacher_id: z.string().uuid(),
    location_id: z.string().uuid(),
    student_id: z.string().uuid().nullable().optional(),
    room_id: z.string().uuid().nullable().optional(),
    room: z.string().nullable().optional(),
    block_type: BlockTypeSchema.optional(),
    status: BlockStatusSchema.optional(),
    is_recurring: z.boolean().optional(),
    is_virtual: z.boolean().optional(),
    is_makeup_session: z.boolean().optional(),
    notes: z.string().nullable().optional(),
    fifth_week: z.boolean().optional(),
    generated_from_availability: z.boolean().optional(),
    original_teacher_id: z.string().uuid().nullable().optional(),
    original_teacher_name: z.string().nullable().optional(),
    checked_in: z.boolean().optional(),
    checked_in_at: z.string().nullable().optional(),
    checked_in_by: z.string().uuid().nullable().optional(),
    teacher_tally: z.boolean().nullable().optional(),
})
    .passthrough();
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const session = await requirePermission("schedule.write")();
        const tenantId = session.tenantId;
        const locationAccess = await resolveUserLocationAccess({
            session,
            autoRepairProfileLocation: true,
        });
        const body = await readJson(req);
        const parsed = BlockCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid schedule_block payload", parsed.error.flatten());
        }
        const locationId = parsed.data.location_id
            ? assertLocationAllowed(locationAccess, parsed.data.location_id)
            : locationAccess.selectedLocationId;
        if (!locationId) {
            return badRequest("Missing location_id");
        }
        const insertData = Object.assign(Object.assign({}, parsed.data), { location_id: locationId });
        const blockType = String((_a = insertData.block_type) !== null && _a !== void 0 ? _a : "student_session");
        const url = new URL(req.url);
        const skipConflict = url.searchParams.get("skip_conflict_check") === "true";
        const isSubCoverage = blockType === "sub";
        const teacherLocation = await validateTeacherLocationAssignment({
            teacherId: insertData.teacher_id,
            locationId: insertData.location_id,
        });
        if (!teacherLocation.ok) {
            return badRequest(teacherLocation.error);
        }
        if (isSubCoverage) {
            const validation = await validateSubCoverage({
                tenantId,
                blockDate: insertData.block_date,
                startTime: insertData.start_time,
                endTime: insertData.end_time,
                teacherId: insertData.teacher_id,
                locationId: insertData.location_id,
                originalTeacherId: typeof insertData.original_teacher_id === "string"
                    ? insertData.original_teacher_id
                    : null,
            });
            if (!validation.ok) {
                return badRequest(validation.error, validation.details);
            }
            insertData.original_teacher_name =
                (_c = (_b = insertData.original_teacher_name) !== null && _b !== void 0 ? _b : validation.originalTeacherName) !== null && _c !== void 0 ? _c : null;
            insertData.status = insertData.student_id ? "booked" : "available";
        }
        if (blockType === "call_out") {
            insertData.status = "available";
            insertData.checked_in = false;
            insertData.checked_in_at = null;
            insertData.checked_in_by = null;
            insertData.teacher_tally = false;
        }
        if (blockType === "makeup_session" || insertData.is_makeup_session === true) {
            if (!insertData.student_id) {
                return badRequest("Makeup sessions require student_id.");
            }
            insertData.block_type = "makeup_session";
            insertData.is_makeup_session = true;
            insertData.status = "booked";
        }
        if (insertData.checked_in === true) {
            insertData.checked_in_at = (_d = insertData.checked_in_at) !== null && _d !== void 0 ? _d : new Date().toISOString();
            insertData.checked_in_by =
                (_f = (_e = insertData.checked_in_by) !== null && _e !== void 0 ? _e : session.profileId) !== null && _f !== void 0 ? _f : session.userId;
            insertData.teacher_tally =
                typeof insertData.teacher_tally === "boolean" ? insertData.teacher_tally : true;
            insertData.status = "booked";
        }
        if (!skipConflict && !isSubCoverage) {
            const conflicts = await findConflictingBlocks(tenantId, insertData.teacher_id, insertData.block_date, insertData.start_time, insertData.end_time);
            if (conflicts.length > 0) {
                return badRequest("Teacher has conflicting block(s).", {
                    conflicts: conflicts.map((c) => ({
                        id: c.id,
                        block_date: c.block_date,
                        start_time: c.start_time,
                        end_time: c.end_time,
                        status: c.status,
                    })),
                });
            }
        }
        const row = await createScheduleBlock(tenantId, insertData);
        if (row.checked_in && row.student_id && row.teacher_id && row.location_id) {
            const existingLog = await getSessionLogByBlockId(row.id, tenantId).catch(() => null);
            if (!existingLog) {
                await createSessionLog(tenantId, {
                    schedule_block_id: row.id,
                    student_id: row.student_id,
                    teacher_id: row.teacher_id,
                    location_id: row.location_id,
                    block_date: row.block_date,
                    student_rate: 0,
                    teacher_rate: 0,
                    status: "checked_in",
                }).catch(() => null);
            }
        }
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
