import { z } from "zod";
import { deactivateStudent, getStudentById, updateStudent, } from "@data/students";
import { badRequest, noContent, notFound, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const row = await getStudentById(id, tenantId);
        if (!row)
            return notFound();
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
const StudentUpdateSchema = z.object({}).passthrough();
export async function PATCH(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = StudentUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid update payload", parsed.error.flatten());
        }
        const row = await updateStudent(id, tenantId, parsed.data);
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
const DeactivateSchema = z.object({
    deactivated_by: z.string().uuid(),
    reason: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
});
export async function DELETE(req, ctx) {
    var _a, _b;
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = DeactivateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Deactivation requires deactivated_by", parsed.error.flatten());
        }
        await deactivateStudent(id, tenantId, parsed.data.deactivated_by, (_a = parsed.data.reason) !== null && _a !== void 0 ? _a : undefined, (_b = parsed.data.category) !== null && _b !== void 0 ? _b : undefined);
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
