var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { z } from "zod";
import { completeTask, deleteTask, getTaskById, snoozeTask, updateTask, } from "@data/tasks";
import { badRequest, noContent, notFound, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const row = await getTaskById(id, tenantId);
        if (!row)
            return notFound();
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
const TaskPatchSchema = z
    .object({
    action: z.enum(["complete", "snooze"]).optional(),
    completed_by: z.string().uuid().optional(),
    completion_note: z.string().nullable().optional(),
    snoozed_until: z.string().optional(),
})
    .passthrough();
export async function PATCH(req, ctx) {
    var _a;
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = TaskPatchSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid task payload", parsed.error.flatten());
        }
        if (parsed.data.action === "complete") {
            if (!parsed.data.completed_by)
                return badRequest("completed_by is required to complete a task.");
            const row = await completeTask(id, tenantId, parsed.data.completed_by, (_a = parsed.data.completion_note) !== null && _a !== void 0 ? _a : undefined);
            return ok({ data: row });
        }
        if (parsed.data.action === "snooze") {
            if (!parsed.data.snoozed_until)
                return badRequest("snoozed_until is required to snooze a task.");
            const row = await snoozeTask(id, tenantId, parsed.data.snoozed_until);
            return ok({ data: row });
        }
        const _b = parsed.data, { action: _action } = _b, updates = __rest(_b, ["action"]);
        void _action;
        const row = await updateTask(id, tenantId, updates);
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function DELETE(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        await deleteTask(id, tenantId);
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
