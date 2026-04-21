import { NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { detectConflicts } from "@/lib/scheduling/queries";
import { resolveSchedulingContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
function defaultRange() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 13);
    return {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
    };
}
export async function GET(req) {
    var _a, _b, _c;
    try {
        const url = new URL(req.url);
        const tenantParam = ((_a = url.searchParams.get("tenantId")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        const start = (_b = url.searchParams.get("start")) === null || _b === void 0 ? void 0 : _b.trim();
        const end = (_c = url.searchParams.get("end")) === null || _c === void 0 ? void 0 : _c.trim();
        let ctx;
        try {
            ctx = await resolveSchedulingContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        if ((start && !end) || (!start && end)) {
            return badRequest("Provide both start and end, or neither.");
        }
        const range = start && end ? { start, end } : defaultRange();
        const conflicts = await detectConflicts(ctx.tenantId, range);
        await logAudit("scheduling.conflicts.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            rangeStart: range.start,
            rangeEnd: range.end,
            total: conflicts.length,
        });
        return ok({
            tenantId: ctx.tenantId,
            range,
            conflicts,
            total: conflicts.length,
        });
    }
    catch (err) {
        return serverError(err);
    }
}
