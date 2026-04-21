import { z } from "zod";
import { updateLead } from "@data/leads";
import { ok, readJson, serverError, badRequest } from "@/lib/http";
import { resolveCRMContext } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Matches `Database["public"]["Enums"]["lead_stage"]`. */
const STAGES = [
    "inquiry",
    "contacted",
    "scheduled",
    "enrolled",
    "lost",
];
const PatchSchema = z.object({
    stage: z.enum(STAGES),
});
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
        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid lead patch", parsed.error.flatten());
        }
        const row = await updateLead(id, resolved.context.tenantId, {
            stage: parsed.data.stage,
        });
        return ok({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
