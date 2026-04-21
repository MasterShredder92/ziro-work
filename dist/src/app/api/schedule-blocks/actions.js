"use server";
import { revalidatePath } from "next/cache";
import { createScheduleBlock, findConflictingBlocks, deleteScheduleBlock, getScheduleBlockById, listScheduleBlocks, updateScheduleBlock, } from "@data/scheduleBlocks";
import { createSessionLog, getSessionLogByBlockId } from "@data/sessionLog";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { validateSubCoverage } from "@/lib/schedule/subCoverageIntegrity";
import { validateTeacherLocationAssignment } from "@/lib/schedule/teacherAssignmentIntegrity";
function revalidateSchedulingSurfaces() {
    revalidatePath("/schedule");
    revalidatePath("/scheduling");
}
export async function listScheduleBlocksAction(tenantId, filter) {
    await assertTenantAccess(tenantId);
    return listScheduleBlocks(tenantId, filter);
}
export async function getScheduleBlockAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    return getScheduleBlockById(id, tenantId);
}
export async function createScheduleBlockAction(tenantId, input, opts) {
    var _a, _b, _c;
    await assertTenantAccess(tenantId);
    const blockType = (_a = input.block_type) !== null && _a !== void 0 ? _a : "student_session";
    const teacherAssignment = await validateTeacherLocationAssignment({
        teacherId: input.teacher_id,
        locationId: input.location_id,
    });
    if (!teacherAssignment.ok)
        throw new Error(teacherAssignment.error);
    if (blockType === "sub") {
        const validation = await validateSubCoverage({
            tenantId,
            blockDate: input.block_date,
            startTime: input.start_time,
            endTime: input.end_time,
            teacherId: input.teacher_id,
            locationId: input.location_id,
            originalTeacherId: input.original_teacher_id,
        });
        if (!validation.ok)
            throw new Error(validation.error);
    }
    if (!(opts === null || opts === void 0 ? void 0 : opts.skipConflictCheck)) {
        const conflicts = await findConflictingBlocks(tenantId, input.teacher_id, input.block_date, input.start_time, input.end_time);
        if (conflicts.length > 0) {
            const err = new Error("Teacher has conflicting block(s).");
            err.conflicts = conflicts;
            err.code = "SCHEDULE_CONFLICT";
            throw err;
        }
    }
    await logAudit("schedule_blocks.create", { tenantId, input });
    const normalized = Object.assign(Object.assign({}, input), { status: blockType === "call_out"
            ? "available"
            : input.checked_in
                ? "booked"
                : input.status, checked_in_at: input.checked_in ? (_b = input.checked_in_at) !== null && _b !== void 0 ? _b : new Date().toISOString() : input.checked_in_at, teacher_tally: input.checked_in && typeof input.teacher_tally !== "boolean"
            ? true
            : input.teacher_tally, original_teacher_name: blockType === "sub" ? (_c = input.original_teacher_name) !== null && _c !== void 0 ? _c : null : input.original_teacher_name });
    const row = await createScheduleBlock(tenantId, normalized);
    if (row.checked_in && row.student_id && row.teacher_id && row.location_id) {
        const existing = await getSessionLogByBlockId(row.id, tenantId).catch(() => null);
        if (!existing) {
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
    revalidateSchedulingSurfaces();
    return row;
}
export async function updateScheduleBlockAction(tenantId, id, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    await assertTenantAccess(tenantId);
    const current = await getScheduleBlockById(id, tenantId);
    if (!current)
        throw new Error(`schedule_block ${id} not found`);
    const nextTeacherId = (_a = input.teacher_id) !== null && _a !== void 0 ? _a : current.teacher_id;
    const nextLocationId = (_b = input.location_id) !== null && _b !== void 0 ? _b : current.location_id;
    const nextBlockType = (_c = input.block_type) !== null && _c !== void 0 ? _c : current.block_type;
    const nextBlockDate = (_d = input.block_date) !== null && _d !== void 0 ? _d : current.block_date;
    const nextStartTime = (_e = input.start_time) !== null && _e !== void 0 ? _e : current.start_time;
    const nextEndTime = (_f = input.end_time) !== null && _f !== void 0 ? _f : current.end_time;
    const nextOriginalTeacherId = (_g = input.original_teacher_id) !== null && _g !== void 0 ? _g : current.original_teacher_id;
    const teacherAssignment = await validateTeacherLocationAssignment({
        teacherId: nextTeacherId,
        locationId: nextLocationId,
    });
    if (!teacherAssignment.ok)
        throw new Error(teacherAssignment.error);
    if (nextBlockType === "sub") {
        const validation = await validateSubCoverage({
            tenantId,
            blockDate: nextBlockDate,
            startTime: nextStartTime,
            endTime: nextEndTime,
            teacherId: nextTeacherId,
            locationId: nextLocationId,
            originalTeacherId: nextOriginalTeacherId,
            excludeBlockId: id,
        });
        if (!validation.ok)
            throw new Error(validation.error);
    }
    else if (input.teacher_id !== undefined ||
        input.block_date !== undefined ||
        input.start_time !== undefined ||
        input.end_time !== undefined) {
        const conflicts = await findConflictingBlocks(tenantId, nextTeacherId, nextBlockDate, nextStartTime, nextEndTime, id);
        if (conflicts.length > 0) {
            const err = new Error("Teacher has conflicting block(s).");
            err.conflicts = conflicts;
            err.code = "SCHEDULE_CONFLICT";
            throw err;
        }
    }
    await logAudit("schedule_blocks.update", { tenantId, id, input });
    const patch = Object.assign({}, input);
    if (patch.checked_in === true) {
        patch.checked_in_at = (_h = patch.checked_in_at) !== null && _h !== void 0 ? _h : new Date().toISOString();
        if (typeof patch.teacher_tally !== "boolean")
            patch.teacher_tally = true;
        patch.status = "booked";
    }
    else if (patch.checked_in === false) {
        patch.checked_in_at = null;
        patch.checked_in_by = null;
    }
    if (patch.block_type === "call_out") {
        patch.status = "available";
        patch.checked_in = false;
        patch.checked_in_at = null;
        patch.checked_in_by = null;
        patch.teacher_tally = false;
    }
    const row = await updateScheduleBlock(id, tenantId, patch);
    if (row.checked_in && row.student_id && row.teacher_id && row.location_id) {
        const existing = await getSessionLogByBlockId(row.id, tenantId).catch(() => null);
        if (!existing) {
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
    revalidateSchedulingSurfaces();
    return row;
}
export async function deleteScheduleBlockAction(tenantId, id) {
    await assertTenantAccess(tenantId);
    await logAudit("schedule_blocks.delete", { tenantId, id });
    await deleteScheduleBlock(id, tenantId);
    revalidateSchedulingSurfaces();
}
