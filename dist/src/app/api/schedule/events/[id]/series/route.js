import { getEvent } from "@/lib/schedule/service";
import { cancelSeries, updateSeries, } from "@/lib/schedule/recurrence";
import { badRequest, noContent, notFound, ok, serverError, } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { forbidden, readJsonSafe, withScheduleAccess, } from "../../../_utils";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function resolveRecurrenceId(tenantId, eventId) {
    var _a;
    const event = await getEvent(tenantId, eventId);
    return (_a = event === null || event === void 0 ? void 0 : event.recurrenceId) !== null && _a !== void 0 ? _a : null;
}
export async function PATCH(req, ctx) {
    var _a;
    try {
        const { session, tenantId } = await withScheduleAccess(req, "schedule.write");
        const { id } = await ctx.params;
        const recurrenceId = await resolveRecurrenceId(tenantId, id);
        if (!recurrenceId)
            return notFound("RECURRENCE_NOT_FOUND");
        const body = (_a = (await readJsonSafe(req))) !== null && _a !== void 0 ? _a : {};
        if (!body.rulePatch && !body.eventPatch) {
            return badRequest("INVALID_BODY", {
                expected: { rulePatch: "object?", eventPatch: "object?" },
            });
        }
        const result = await updateSeries(tenantId, recurrenceId, body);
        await logAudit("schedule.series.update", {
            tenantId,
            profileId: session.userId,
            recurrenceId,
            eventId: id,
            updatedCount: result.updatedCount,
        });
        return ok({ data: result });
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
export async function DELETE(req, ctx) {
    var _a;
    try {
        const { session, tenantId } = await withScheduleAccess(req, "schedule.write");
        const { id } = await ctx.params;
        const recurrenceId = await resolveRecurrenceId(tenantId, id);
        if (!recurrenceId)
            return notFound("RECURRENCE_NOT_FOUND");
        const url = new URL(req.url);
        const fromTime = (_a = url.searchParams.get("fromTime")) !== null && _a !== void 0 ? _a : undefined;
        const deleteRule = url.searchParams.get("deleteRule") === "true";
        const result = await cancelSeries(tenantId, recurrenceId, {
            fromTime,
            deleteRule,
        });
        await logAudit("schedule.series.cancel", {
            tenantId,
            profileId: session.userId,
            recurrenceId,
            eventId: id,
            removedCount: result.removedCount,
            ruleRemoved: result.ruleRemoved,
        });
        return noContent();
    }
    catch (err) {
        if (err instanceof Error && err.message === "FORBIDDEN")
            return forbidden();
        return serverError(err);
    }
}
