import { z } from "zod";
import { badRequest, created, notFound, ok, readJson, resolveTenantId, } from "@/lib/http";
import { resolveAttendanceContext, respondAttendanceError, } from "@/lib/attendance/guard";
import { getSessionWithRoster } from "@/lib/attendance/service";
import { markAbsent, markExcused, markMakeup, markNoShow, markPresent, markTardy, } from "@/lib/attendance/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    try {
        const { sessionId } = await ctx.params;
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
        const data = await getSessionWithRoster(sessionId, tenantId);
        if (!data)
            return notFound();
        return ok({ data });
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
const MarkSingleSchema = z.object({
    studentId: z.string().min(1),
    status: z.enum([
        "present",
        "absent",
        "tardy",
        "excused",
        "makeup",
        "no_show",
    ]),
    markedBy: z.string().nullable().optional(),
    arrivedAt: z.string().nullable().optional(),
    leftAt: z.string().nullable().optional(),
    minutesLate: z.number().int().nullable().optional(),
    reasonId: z.string().nullable().optional(),
    reasonText: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    scheduleBlockId: z.string().nullable().optional(),
    teacherId: z.string().nullable().optional(),
});
const BulkSchema = z.object({
    entries: z.array(MarkSingleSchema).min(1).max(500),
});
const BodySchema = z.union([MarkSingleSchema, BulkSchema]);
function dispatchMark(input, status) {
    switch (status) {
        case "present":
            return markPresent(input);
        case "absent":
            return markAbsent(input);
        case "tardy":
            return markTardy(input);
        case "excused":
            return markExcused(input);
        case "makeup":
            return markMakeup(input);
        case "no_show":
            return markNoShow(input);
        default:
            throw new Error("INVALID_STATUS");
    }
}
export async function POST(req, ctx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    try {
        const { sessionId } = await ctx.params;
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");
        const body = await readJson(req);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid mark payload", parsed.error.flatten());
        }
        if ("entries" in parsed.data) {
            const results = [];
            for (const entry of parsed.data.entries) {
                const out = await dispatchMark({
                    tenantId,
                    sessionId,
                    studentId: entry.studentId,
                    markedBy: (_a = entry.markedBy) !== null && _a !== void 0 ? _a : null,
                    arrivedAt: (_b = entry.arrivedAt) !== null && _b !== void 0 ? _b : null,
                    leftAt: (_c = entry.leftAt) !== null && _c !== void 0 ? _c : null,
                    minutesLate: (_d = entry.minutesLate) !== null && _d !== void 0 ? _d : null,
                    reasonId: (_e = entry.reasonId) !== null && _e !== void 0 ? _e : null,
                    reasonText: (_f = entry.reasonText) !== null && _f !== void 0 ? _f : null,
                    notes: (_g = entry.notes) !== null && _g !== void 0 ? _g : null,
                    scheduleBlockId: (_h = entry.scheduleBlockId) !== null && _h !== void 0 ? _h : null,
                    teacherId: (_j = entry.teacherId) !== null && _j !== void 0 ? _j : null,
                }, entry.status);
                results.push(out);
            }
            return created({ data: results, count: results.length });
        }
        const row = await dispatchMark({
            tenantId,
            sessionId,
            studentId: parsed.data.studentId,
            markedBy: (_k = parsed.data.markedBy) !== null && _k !== void 0 ? _k : null,
            arrivedAt: (_l = parsed.data.arrivedAt) !== null && _l !== void 0 ? _l : null,
            leftAt: (_m = parsed.data.leftAt) !== null && _m !== void 0 ? _m : null,
            minutesLate: (_o = parsed.data.minutesLate) !== null && _o !== void 0 ? _o : null,
            reasonId: (_p = parsed.data.reasonId) !== null && _p !== void 0 ? _p : null,
            reasonText: (_q = parsed.data.reasonText) !== null && _q !== void 0 ? _q : null,
            notes: (_r = parsed.data.notes) !== null && _r !== void 0 ? _r : null,
            scheduleBlockId: (_s = parsed.data.scheduleBlockId) !== null && _s !== void 0 ? _s : null,
            teacherId: (_t = parsed.data.teacherId) !== null && _t !== void 0 ? _t : null,
        }, parsed.data.status);
        return created({ data: row });
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
