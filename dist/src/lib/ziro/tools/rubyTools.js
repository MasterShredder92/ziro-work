import { createScheduleBlock, findConflictingBlocks, listScheduleBlocks, } from "@data/scheduleBlocks";
import { validateScheduleInput } from "./validators";
function requireTenant(input) {
    if (!input.tenantId || input.tenantId.trim().length === 0) {
        throw new Error("tenantId is required");
    }
    return input.tenantId;
}
function buildBlockInsert(args) {
    var _a, _b;
    return {
        teacher_id: args.teacher_id,
        student_id: args.student_id,
        location_id: args.location_id,
        room_id: args.room_id,
        block_date: args.block_date,
        start_time: args.start_time,
        end_time: args.end_time,
        block_type: (_a = args.block_type) !== null && _a !== void 0 ? _a : undefined,
        status: (_b = args.status) !== null && _b !== void 0 ? _b : undefined,
        notes: args.notes,
    };
}
export const createBlockTool = {
    name: "createBlock",
    description: "Create a schedule block for a teacher on a given date. Validates times and requires teacher_id and location_id.",
    handler: async (input) => {
        var _a;
        const tenantId = requireTenant(input);
        const { args, errors } = validateScheduleInput((_a = input.args) !== null && _a !== void 0 ? _a : input.raw);
        if (errors.length > 0) {
            return {
                result: { ok: false, errors },
                metadata: { validation_failed: true },
            };
        }
        const conflicts = await findConflictingBlocks(tenantId, args.teacher_id, args.block_date, args.start_time, args.end_time);
        if (conflicts.length > 0) {
            return {
                result: {
                    ok: false,
                    errors: ["schedule conflict"],
                    conflicts,
                },
                metadata: {
                    entity: "schedule_block",
                    action: "create",
                    conflict_count: conflicts.length,
                },
            };
        }
        const block = await createScheduleBlock(tenantId, buildBlockInsert(args));
        return {
            result: { ok: true, block },
            metadata: {
                entity: "schedule_block",
                action: "create",
                block_id: block.id,
            },
        };
    },
};
export const detectConflictsTool = {
    name: "detectConflicts",
    description: "Detect schedule conflicts for a teacher on a given date between start_time and end_time.",
    handler: async (input) => {
        var _a;
        const tenantId = requireTenant(input);
        const { args, errors } = validateScheduleInput((_a = input.args) !== null && _a !== void 0 ? _a : input.raw);
        const required = ["teacher_id", "block_date", "start_time", "end_time"];
        const missing = required.filter((f) => !args[f]);
        const allErrors = [...errors, ...missing.map((f) => `${f} is required`)];
        const deduped = Array.from(new Set(allErrors));
        if (deduped.some((e) => required.some((f) => e.includes(f)))) {
            return {
                result: { ok: false, errors: deduped },
                metadata: { validation_failed: true },
            };
        }
        const conflicts = await findConflictingBlocks(tenantId, args.teacher_id, args.block_date, args.start_time, args.end_time);
        return {
            result: {
                ok: true,
                has_conflicts: conflicts.length > 0,
                count: conflicts.length,
                conflicts,
            },
            metadata: {
                entity: "schedule_block",
                action: "detect_conflicts",
                conflict_count: conflicts.length,
            },
        };
    },
};
function toMinutes(hhmmss) {
    const [h, m] = hhmmss.split(":");
    return Number.parseInt(h, 10) * 60 + Number.parseInt(m, 10);
}
function toClock(minutes) {
    const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}:00`;
}
export const suggestScheduleTool = {
    name: "suggestSchedule",
    description: "Suggest open time slots for a teacher on a given date. Reads existing blocks and returns gaps of the requested length.",
    handler: async (input) => {
        var _a, _b, _c, _d, _e, _f;
        const tenantId = requireTenant(input);
        const rawObj = typeof input.args === "object" && input.args !== null
            ? input.args
            : safeParse(input.raw);
        const errors = [];
        const teacherId = (_a = pickString(rawObj, ["teacher_id", "teacherId"])) !== null && _a !== void 0 ? _a : null;
        const blockDate = (_b = pickString(rawObj, ["block_date", "date", "day"])) !== null && _b !== void 0 ? _b : null;
        const windowStart = (_c = pickString(rawObj, ["window_start", "from", "start"])) !== null && _c !== void 0 ? _c : "09:00:00";
        const windowEnd = (_d = pickString(rawObj, ["window_end", "to", "end"])) !== null && _d !== void 0 ? _d : "20:00:00";
        const durationMinutesRaw = (_f = (_e = rawObj.duration_minutes) !== null && _e !== void 0 ? _e : rawObj.duration) !== null && _f !== void 0 ? _f : 30;
        const durationMinutes = typeof durationMinutesRaw === "number"
            ? durationMinutesRaw
            : Number.parseInt(String(durationMinutesRaw), 10);
        if (!teacherId)
            errors.push("teacher_id is required");
        if (!blockDate)
            errors.push("block_date is required");
        if (!Number.isFinite(durationMinutes) || durationMinutes <= 0)
            errors.push("duration_minutes must be a positive integer");
        if (errors.length > 0) {
            return {
                result: { ok: false, errors },
                metadata: { validation_failed: true },
            };
        }
        const existing = await listScheduleBlocks(tenantId, {
            teacher_id: teacherId,
            date_from: blockDate,
            date_to: blockDate,
        }, { orderBy: "start_time", ascending: true, limit: 200 });
        const busy = existing.filter((b) => !!b.start_time && !!b.end_time);
        const ws = toMinutes(normalizeClock(windowStart));
        const we = toMinutes(normalizeClock(windowEnd));
        const suggestions = [];
        let cursor = ws;
        const sortedBusy = busy
            .map((b) => ({
            start: toMinutes(normalizeClock(b.start_time)),
            end: toMinutes(normalizeClock(b.end_time)),
        }))
            .sort((a, b) => a.start - b.start);
        for (const slot of sortedBusy) {
            if (slot.start >= we)
                break;
            const gapEnd = Math.min(slot.start, we);
            while (cursor + durationMinutes <= gapEnd) {
                suggestions.push({
                    start: toClock(cursor),
                    end: toClock(cursor + durationMinutes),
                });
                cursor += durationMinutes;
            }
            cursor = Math.max(cursor, slot.end);
        }
        while (cursor + durationMinutes <= we) {
            suggestions.push({
                start: toClock(cursor),
                end: toClock(cursor + durationMinutes),
            });
            cursor += durationMinutes;
        }
        return {
            result: {
                ok: true,
                block_date: blockDate,
                teacher_id: teacherId,
                duration_minutes: durationMinutes,
                suggestions,
                busy_count: busy.length,
            },
            metadata: {
                entity: "schedule_block",
                action: "suggest",
                suggestion_count: suggestions.length,
            },
        };
    },
};
function normalizeClock(t) {
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(t))
        return t;
    if (/^\d{1,2}:\d{2}$/.test(t))
        return `${t}:00`;
    return t;
}
function pickString(obj, keys) {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "string" && v.trim().length > 0)
            return v.trim();
    }
    return null;
}
function safeParse(raw) {
    try {
        const p = JSON.parse(raw);
        if (p && typeof p === "object" && !Array.isArray(p))
            return p;
    }
    catch (_a) {
        // ignore
    }
    return {};
}
