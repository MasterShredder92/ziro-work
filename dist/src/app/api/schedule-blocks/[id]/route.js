import { z } from "zod";
import { deleteScheduleBlock, findConflictingBlocks, getScheduleBlockById, updateScheduleBlock, } from "@data/scheduleBlocks";
import { createSessionLog, getSessionLogByBlockId } from "@data/sessionLog";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { validateSubCoverage } from "@/lib/schedule/subCoverageIntegrity";
import { validateTeacherLocationAssignment } from "@/lib/schedule/teacherAssignmentIntegrity";
import { badRequest, noContent, notFound, ok, readJson, serverError, } from "@/lib/http";
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
export async function GET(req, ctx) {
    try {
        const session = await requirePermission("schedule.read")();
        const { id } = await ctx.params;
        const tenantId = session.tenantId;
        const row = await getScheduleBlockById(id, tenantId);
        if (!row)
            return notFound();
        const access = await resolveUserLocationAccess({
            session,
            preferredLocationId: row.location_id,
            autoRepairProfileLocation: true,
        });
        const allowedLocationId = assertLocationAllowed(access, row.location_id);
        if (!allowedLocationId || allowedLocationId !== row.location_id) {
            return badRequest("Location access denied");
        }
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
const BlockUpdateSchema = z
    .object({
    block_date: z.string().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    teacher_id: z.string().uuid().optional(),
    location_id: z.string().uuid().optional(),
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
    checked_in: z.boolean().optional(),
    checked_in_at: z.string().nullable().optional(),
    checked_in_by: z.string().uuid().nullable().optional(),
    callout_reason: z.string().nullable().optional(),
    callout_id: z.string().uuid().nullable().optional(),
    original_teacher_id: z.string().uuid().nullable().optional(),
    original_teacher_name: z.string().nullable().optional(),
    teacher_tally: z.boolean().nullable().optional(),
    converted_to_virtual_at: z.string().nullable().optional(),
})
    .passthrough();
export async function PATCH(req, ctx) {
    try {
        const session = await requirePermission("schedule.write")();
        const { id } = await ctx.params;
        const tenantId = session.tenantId;
        const body = await readJson(req);
        const parsed = BlockUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid update payload", parsed.error.flatten());
        }
        const current = await getScheduleBlockById(id, tenantId);
        if (!current)
            return notFound();
        const access = await resolveUserLocationAccess({
            session,
            preferredLocationId: current.location_id,
            autoRepairProfileLocation: true,
        });
        const currentLocationAllowed = assertLocationAllowed(access, current.location_id);
        if (!currentLocationAllowed || currentLocationAllowed !== current.location_id) {
            return badRequest("Location access denied");
        }
        const u = parsed.data;
        const targetLocationId = typeof u.location_id === "string" && u.location_id.trim().length > 0
            ? assertLocationAllowed(access, u.location_id)
            : current.location_id;
        if (!targetLocationId) {
            return badRequest("Missing location_id");
        }
        const nextBlockType = typeof u.block_type === "string" && u.block_type.trim().length > 0
            ? u.block_type.trim()
            : current.block_type;
        const nextTeacherId = typeof u.teacher_id === "string" && u.teacher_id.trim().length > 0
            ? u.teacher_id.trim()
            : current.teacher_id;
        const nextBlockDate = typeof u.block_date === "string" && u.block_date.trim().length > 0
            ? u.block_date.trim()
            : current.block_date;
        const nextStartTime = typeof u.start_time === "string" && u.start_time.trim().length > 0
            ? u.start_time.trim()
            : current.start_time;
        const nextEndTime = typeof u.end_time === "string" && u.end_time.trim().length > 0
            ? u.end_time.trim()
            : current.end_time;
        const nextOriginalTeacherId = typeof u.original_teacher_id === "string" && u.original_teacher_id.trim().length > 0
            ? u.original_teacher_id.trim()
            : current.original_teacher_id;
        const teacherLocation = await validateTeacherLocationAssignment({
            teacherId: nextTeacherId,
            locationId: targetLocationId,
        });
        if (!teacherLocation.ok) {
            return badRequest(teacherLocation.error);
        }
        const url = new URL(req.url);
        const skipConflict = url.searchParams.get("skip_conflict_check") === "true";
        const isSubCoverage = nextBlockType === "sub";
        if (isSubCoverage) {
            const validation = await validateSubCoverage({
                tenantId,
                blockDate: nextBlockDate,
                startTime: nextStartTime,
                endTime: nextEndTime,
                teacherId: nextTeacherId,
                locationId: targetLocationId,
                originalTeacherId: nextOriginalTeacherId,
                excludeBlockId: id,
            });
            if (!validation.ok) {
                return badRequest(validation.error, validation.details);
            }
            u.original_teacher_name =
                (typeof u.original_teacher_name === "string" && u.original_teacher_name.trim()) ||
                    validation.originalTeacherName ||
                    null;
            u.status =
                (typeof u.student_id === "string" && u.student_id.trim().length > 0) ||
                    (u.student_id === undefined && typeof current.student_id === "string" && current.student_id.length > 0)
                    ? "booked"
                    : "available";
        }
        if (!skipConflict && !isSubCoverage) {
            if (u.teacher_id || u.block_date || u.start_time || u.end_time) {
                const conflicts = await findConflictingBlocks(tenantId, nextTeacherId, nextBlockDate, nextStartTime, nextEndTime, id);
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
        }
        const patchData = Object.assign({}, parsed.data);
        patchData.location_id = targetLocationId;
        if (patchData.checked_in === true) {
            if (!patchData.checked_in_at)
                patchData.checked_in_at = new Date().toISOString();
            if (!patchData.checked_in_by) {
                patchData.checked_in_by = session.profileId || session.userId;
            }
            if (typeof patchData.teacher_tally !== "boolean") {
                patchData.teacher_tally = true;
            }
            patchData.status = "booked";
        }
        else if (patchData.checked_in === false) {
            patchData.checked_in_at = null;
            patchData.checked_in_by = null;
        }
        if (patchData.block_type === "call_out") {
            patchData.status = "available";
            patchData.checked_in = false;
            patchData.checked_in_at = null;
            patchData.checked_in_by = null;
            patchData.teacher_tally = false;
        }
        if (patchData.block_type === "makeup_session" ||
            patchData.is_makeup_session === true) {
            const nextStudentId = typeof patchData.student_id === "string" && patchData.student_id.trim().length > 0
                ? patchData.student_id
                : current.student_id;
            if (!nextStudentId) {
                return badRequest("Makeup sessions require student_id.");
            }
            patchData.block_type = "makeup_session";
            patchData.is_makeup_session = true;
            patchData.status = "booked";
        }
        if (patchData.block_type === "virtual" || patchData.is_virtual === true) {
            patchData.is_virtual = true;
            if (!patchData.converted_to_virtual_at) {
                patchData.converted_to_virtual_at = new Date().toISOString();
            }
        }
        const row = await updateScheduleBlock(id, tenantId, patchData);
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
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function DELETE(req, ctx) {
    try {
        const session = await requirePermission("schedule.write")();
        const { id } = await ctx.params;
        const tenantId = session.tenantId;
        const row = await getScheduleBlockById(id, tenantId);
        if (!row)
            return notFound();
        const access = await resolveUserLocationAccess({
            session,
            preferredLocationId: row.location_id,
            autoRepairProfileLocation: true,
        });
        const allowedLocationId = assertLocationAllowed(access, row.location_id);
        if (!allowedLocationId || allowedLocationId !== row.location_id) {
            return badRequest("Location access denied");
        }
        await deleteScheduleBlock(id, tenantId);
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
