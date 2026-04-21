import { z } from "zod";
import { getFamilyById, updateFamily } from "@data/families";
import { badRequest, notFound, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const row = await getFamilyById(id, tenantId);
        if (!row)
            return notFound();
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
const FamilyUpdateSchema = z.object({}).passthrough();
export async function PATCH(req, ctx) {
    try {
        const { id } = await ctx.params;
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = FamilyUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid update payload", parsed.error.flatten());
        }
        const row = await updateFamily(id, tenantId, parsed.data);
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
