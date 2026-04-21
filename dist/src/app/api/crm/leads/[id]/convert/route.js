import { promoteLeadToStudent } from "@/lib/crm";
import { created, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id } = await ctx.params;
        const result = await promoteLeadToStudent(id, resolved.context.tenantId);
        return created({
            data: { studentId: result.studentId, leadId: result.leadId },
        });
    }
    catch (err) {
        return serverError(err);
    }
}
