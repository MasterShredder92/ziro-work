import { z } from "zod";
import { deleteFamily, getFamilyById, updateFamily, } from "@data/families";
import { badRequest, noContent, notFound, ok, readJson, serverError, } from "@/lib/http";
import { resolveCRMContext } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read"],
        minRole: "family",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id } = await ctx.params;
        const row = await getFamilyById(id, resolved.context.tenantId);
        if (!row)
            return notFound();
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
const UpdateSchema = z.object({}).passthrough();
export async function PATCH(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id } = await ctx.params;
        const body = await readJson(req);
        const parsed = UpdateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid family patch", parsed.error.flatten());
        }
        const row = await updateFamily(id, resolved.context.tenantId, parsed.data);
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function DELETE(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "admin",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id } = await ctx.params;
        await deleteFamily(id, resolved.context.tenantId);
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
