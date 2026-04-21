import { getTeacherWeeklyAvailability, setTeacherAvailability, } from "@/lib/schedule/availability";
import { badRequest, ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read", "schedule.read"],
        minRole: "teacher",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id: teacherId } = await ctx.params;
        const data = await getTeacherWeeklyAvailability(resolved.context.tenantId, teacherId);
        return ok({ data });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function POST(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write", "schedule.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id: teacherId } = await ctx.params;
        let body = null;
        try {
            body = (await req.json());
        }
        catch (_a) {
            return badRequest("INVALID_BODY");
        }
        if (!body || !Array.isArray(body.slots)) {
            return badRequest("INVALID_BODY", { expected: { slots: "array" } });
        }
        const slots = await setTeacherAvailability(resolved.context.tenantId, teacherId, body.slots);
        return ok({ data: slots, count: slots.length });
    }
    catch (err) {
        return serverError(err);
    }
}
