import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSessionLog } from "@data/sessionLog";
import { getTeachersForTenant } from "@data/teachers";
const TEACHER_OVERLOAD_THRESHOLD = 30;
const TEACHER_OPEN_SLOT_THRESHOLD = 8;
const MAKEUP_LOOKBACK_DAYS = 14;
function toDateKey(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function isCancelledStatus(status) {
    if (typeof status !== "string")
        return false;
    const lower = status.toLowerCase();
    return lower === "cancelled" || lower === "canceled";
}
function teacherName(teacher) {
    const first = typeof teacher.first_name === "string" ? teacher.first_name : "";
    const last = typeof teacher.last_name === "string" ? teacher.last_name : "";
    const name = `${first} ${last}`.trim();
    if (name.length > 0)
        return name;
    if (typeof teacher.name === "string" && teacher.name.trim().length > 0) {
        return teacher.name.trim();
    }
    return teacher.id;
}
export const detectTeacherOverload = {
    key: "detectTeacherOverload",
    description: "Flag teachers scheduled above the weekly block threshold.",
    async handler(ctx) {
        var _a;
        const start = toDateKey(ctx.now);
        const end = toDateKey(addDays(ctx.now, 7));
        const blocks = await listScheduleBlocks(ctx.tenantId, { date_from: start, date_to: end }, { limit: 2000, ascending: true });
        const counts = new Map();
        for (const block of blocks) {
            if (!block.teacher_id)
                continue;
            if (isCancelledStatus(block.status))
                continue;
            counts.set(block.teacher_id, ((_a = counts.get(block.teacher_id)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
        const { data: teachers } = await getTeachersForTenant(ctx.tenantId);
        const teacherMap = new Map();
        for (const teacher of teachers !== null && teachers !== void 0 ? teachers : [])
            teacherMap.set(teacher.id, teacher);
        const overloaded = Array.from(counts.entries())
            .filter(([, count]) => count >= TEACHER_OVERLOAD_THRESHOLD)
            .map(([teacherId, count]) => ({
            teacherId,
            teacherName: teacherMap.has(teacherId)
                ? teacherName(teacherMap.get(teacherId))
                : teacherId,
            blocks: count,
        }))
            .sort((a, b) => b.blocks - a.blocks);
        return {
            triggered: overloaded.length > 0,
            details: {
                windowStart: start,
                windowEnd: end,
                threshold: TEACHER_OVERLOAD_THRESHOLD,
                teachers: overloaded,
            },
        };
    },
};
export const detectOpenSlots = {
    key: "detectOpenSlots",
    description: "Flag teachers with low booking volume in the next seven days.",
    async handler(ctx) {
        var _a;
        const start = toDateKey(ctx.now);
        const end = toDateKey(addDays(ctx.now, 7));
        const blocks = await listScheduleBlocks(ctx.tenantId, { date_from: start, date_to: end }, { limit: 2000, ascending: true });
        const counts = new Map();
        for (const block of blocks) {
            if (!block.teacher_id)
                continue;
            if (isCancelledStatus(block.status))
                continue;
            counts.set(block.teacher_id, ((_a = counts.get(block.teacher_id)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
        const { data: teachers } = await getTeachersForTenant(ctx.tenantId);
        const activeTeachers = (teachers !== null && teachers !== void 0 ? teachers : []).filter((teacher) => {
            const status = teacher.status;
            if (typeof status !== "string")
                return true;
            const lower = status.toLowerCase();
            return lower === "" || lower === "active";
        });
        const open = activeTeachers
            .map((teacher) => {
            var _a;
            return ({
                teacherId: teacher.id,
                teacherName: teacherName(teacher),
                blocks: (_a = counts.get(teacher.id)) !== null && _a !== void 0 ? _a : 0,
            });
        })
            .filter((entry) => entry.blocks <= TEACHER_OPEN_SLOT_THRESHOLD)
            .sort((a, b) => a.blocks - b.blocks);
        return {
            triggered: open.length > 0,
            details: {
                windowStart: start,
                windowEnd: end,
                threshold: TEACHER_OPEN_SLOT_THRESHOLD,
                teachers: open,
            },
        };
    },
};
export const autoSuggestMakeupLessons = {
    key: "autoSuggestMakeupLessons",
    description: "Suggest makeup lessons for recent cancellations and no-shows.",
    async handler(ctx) {
        const end = toDateKey(ctx.now);
        const start = toDateKey(addDays(ctx.now, -MAKEUP_LOOKBACK_DAYS));
        const sessions = await listSessionLog(ctx.tenantId, { date_from: start, date_to: end }, { limit: 1000, ascending: false });
        const missed = sessions.filter((session) => {
            var _a;
            const status = ((_a = session.status) !== null && _a !== void 0 ? _a : "").toLowerCase();
            return (status === "canceled" ||
                status === "cancelled" ||
                status === "no_show" ||
                status === "noshow");
        });
        const suggestions = missed.map((session) => {
            var _a;
            return ({
                sessionLogId: session.id,
                studentId: session.student_id,
                teacherId: session.teacher_id,
                blockDate: session.block_date,
                status: session.status,
                instrument: (_a = session.instrument) !== null && _a !== void 0 ? _a : null,
            });
        });
        return {
            triggered: suggestions.length > 0,
            details: {
                windowStart: start,
                windowEnd: end,
                count: suggestions.length,
                suggestions,
            },
        };
    },
};
export const scheduleAutoActions = {
    key: "schedule",
    description: "Schedule and capacity automations.",
    actions: [detectTeacherOverload, detectOpenSlots, autoSuggestMakeupLessons],
};
