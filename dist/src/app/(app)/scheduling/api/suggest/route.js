import { NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { suggestSchedule } from "@/lib/scheduling/queries";
import { resolveSchedulingContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const url = new URL(req.url);
        const tenantParam = ((_a = url.searchParams.get("tenantId")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        const teacherId = ((_b = url.searchParams.get("teacherId")) === null || _b === void 0 ? void 0 : _b.trim()) || undefined;
        const studentId = ((_c = url.searchParams.get("studentId")) === null || _c === void 0 ? void 0 : _c.trim()) || undefined;
        const roomId = ((_d = url.searchParams.get("roomId")) === null || _d === void 0 ? void 0 : _d.trim()) || undefined;
        const durationRaw = (_e = url.searchParams.get("duration")) === null || _e === void 0 ? void 0 : _e.trim();
        const start = (_f = url.searchParams.get("start")) === null || _f === void 0 ? void 0 : _f.trim();
        const end = (_g = url.searchParams.get("end")) === null || _g === void 0 ? void 0 : _g.trim();
        const limitRaw = (_h = url.searchParams.get("limit")) === null || _h === void 0 ? void 0 : _h.trim();
        let ctx;
        try {
            ctx = await resolveSchedulingContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const duration = Number(durationRaw !== null && durationRaw !== void 0 ? durationRaw : "30");
        if (!Number.isFinite(duration) || duration <= 0 || duration > 480) {
            return badRequest("duration must be between 1 and 480 minutes.");
        }
        if ((start && !end) || (!start && end)) {
            return badRequest("Provide both start and end, or neither.");
        }
        const range = start && end ? { start, end } : undefined;
        const limit = limitRaw ? Number(limitRaw) : undefined;
        const suggestions = await suggestSchedule(ctx.tenantId, {
            teacherId,
            studentId,
            roomId,
            duration,
            range,
            limit: Number.isFinite(limit) && limit ? Math.min(50, Number(limit)) : undefined,
        });
        await logAudit("scheduling.suggest.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            teacherId: teacherId !== null && teacherId !== void 0 ? teacherId : null,
            studentId: studentId !== null && studentId !== void 0 ? studentId : null,
            roomId: roomId !== null && roomId !== void 0 ? roomId : null,
            duration,
            rangeStart: (_j = range === null || range === void 0 ? void 0 : range.start) !== null && _j !== void 0 ? _j : null,
            rangeEnd: (_k = range === null || range === void 0 ? void 0 : range.end) !== null && _k !== void 0 ? _k : null,
            returned: suggestions.length,
        });
        return ok({
            tenantId: ctx.tenantId,
            duration,
            teacherId: teacherId !== null && teacherId !== void 0 ? teacherId : null,
            studentId: studentId !== null && studentId !== void 0 ? studentId : null,
            roomId: roomId !== null && roomId !== void 0 ? roomId : null,
            range: range !== null && range !== void 0 ? range : null,
            suggestions,
        });
    }
    catch (err) {
        return serverError(err);
    }
}
