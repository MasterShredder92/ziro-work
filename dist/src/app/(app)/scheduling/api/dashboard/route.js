import { NextResponse } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { invokeSkill } from "@/lib/ziro/invokeSkill";
import { getSchedulingDashboard } from "@/lib/scheduling/service";
import { resolveSchedulingContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
    var _a, _b, _c, _d, _e;
    try {
        const url = new URL(req.url);
        const tenantParam = ((_a = url.searchParams.get("tenantId")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        const start = (_b = url.searchParams.get("start")) === null || _b === void 0 ? void 0 : _b.trim();
        const end = (_c = url.searchParams.get("end")) === null || _c === void 0 ? void 0 : _c.trim();
        const skillParam = (_e = (_d = url.searchParams.get("skill")) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : "";
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
        const range = start && end ? { start, end } : undefined;
        const data = await getSchedulingDashboard(ctx.tenantId, range);
        await logAudit("scheduling.dashboard.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            rangeStart: data.range.start,
            rangeEnd: data.range.end,
            blocks: data.blocks.length,
            conflicts: data.conflicts.length,
            source: "api",
        });
        let automation = null;
        if (skillParam.length > 0) {
            const result = await invokeSkill(skillParam, {
                tenantId: ctx.tenantId,
                profileId: ctx.session.userId,
                extra: {
                    scope: "scheduling",
                    rangeStart: data.range.start,
                    rangeEnd: data.range.end,
                },
            });
            automation = result;
            await logAudit("scheduling.skill.invoke", {
                tenantId: ctx.tenantId,
                profileId: ctx.session.userId,
                skillId: skillParam,
                ok: result.ok,
                durationMs: result.durationMs,
            });
        }
        return ok({ data, automation });
    }
    catch (err) {
        return serverError(err);
    }
}
