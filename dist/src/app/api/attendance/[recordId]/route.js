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
import { badRequest, noContent, notFound, ok, readJson, resolveTenantId, } from "@/lib/http";
import { resolveAttendanceContext, respondAttendanceError, } from "@/lib/attendance/guard";
import { deleteAttendanceRecord, getAttendanceRecordById, upsertAttendanceRecord, } from "@data/attendanceRecords";
import { overrideRecord } from "@/lib/attendance/service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    try {
        const { recordId } = await ctx.params;
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
        const row = await getAttendanceRecordById(recordId, tenantId);
        if (!row)
            return notFound();
        return ok({ data: row });
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
const PatchSchema = z
    .object({
    override: z
        .object({
        status: z.enum([
            "present",
            "absent",
            "tardy",
            "excused",
            "makeup",
            "no_show",
        ]),
        reasonText: z.string().min(1),
        markedBy: z.string().nullable().optional(),
        minutesLate: z.number().int().nullable().optional(),
        arrivedAt: z.string().nullable().optional(),
        leftAt: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
    })
        .optional(),
})
    .passthrough();
export async function PATCH(req, ctx) {
    var _a, _b, _c, _d, _e;
    try {
        const { recordId } = await ctx.params;
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");
        const body = await readJson(req);
        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid patch payload", parsed.error.flatten());
        }
        const existing = await getAttendanceRecordById(recordId, tenantId);
        if (!existing)
            return notFound();
        if (parsed.data.override) {
            const override = await overrideRecord({
                tenantId,
                recordId,
                status: parsed.data.override.status,
                reasonText: parsed.data.override.reasonText,
                markedBy: (_a = parsed.data.override.markedBy) !== null && _a !== void 0 ? _a : null,
                minutesLate: (_b = parsed.data.override.minutesLate) !== null && _b !== void 0 ? _b : null,
                arrivedAt: (_c = parsed.data.override.arrivedAt) !== null && _c !== void 0 ? _c : null,
                leftAt: (_d = parsed.data.override.leftAt) !== null && _d !== void 0 ? _d : null,
                notes: (_e = parsed.data.override.notes) !== null && _e !== void 0 ? _e : null,
            });
            return ok({ data: override, overrideOf: existing.id });
        }
        const _f = parsed.data, { override: _skip } = _f, patchFields = __rest(_f, ["override"]);
        void _skip;
        const merged = Object.assign(Object.assign(Object.assign({}, existing), patchFields), { id: existing.id, tenant_id: existing.tenant_id });
        const row = await upsertAttendanceRecord(merged);
        return ok({ data: row });
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
export async function DELETE(req, ctx) {
    try {
        const { recordId } = await ctx.params;
        const hinted = resolveTenantId(req);
        const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");
        const existing = await getAttendanceRecordById(recordId, tenantId);
        if (!existing)
            return notFound();
        await deleteAttendanceRecord(recordId, tenantId);
        return noContent();
    }
    catch (err) {
        return respondAttendanceError(err);
    }
}
