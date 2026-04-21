import { z } from "zod";
import { scheduleFollowup } from "@/lib/crm/leadLifecycle";
import { badRequest, created, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BodySchema = z.object({
    when: z.string().min(1),
});
export async function POST(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id } = await ctx.params;
        const body = await readJson(req);
        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid follow-up payload", parsed.error.flatten());
        }
        const row = await scheduleFollowup(id, parsed.data.when, resolved.context.tenantId);
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}
