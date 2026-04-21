import { getServiceClient } from "@/lib/supabase";
import { badRequest, ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * GET /api/crm/teachers/[id]/locations
 * Returns all location assignments for the teacher, joined with location name/color.
 */
export async function GET(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read"],
        minRole: "teacher",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const { id: teacherId } = await ctx.params;
        const db = getServiceClient();
        const { data, error } = await db
            .from("teacher_locations")
            .select("id, location_id, created_at, locations(id, name, color)")
            .eq("teacher_id", teacherId)
            .order("created_at", { ascending: true });
        if (error)
            return serverError(error);
        return ok({ data: data !== null && data !== void 0 ? data : [] });
    }
    catch (err) {
        return serverError(err);
    }
}
/**
 * POST /api/crm/teachers/[id]/locations
 * Body: { location_id: string }
 * Adds a location assignment for the teacher.
 */
export async function POST(req, ctx) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
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
        if (!(body === null || body === void 0 ? void 0 : body.location_id)) {
            return badRequest("MISSING_LOCATION_ID");
        }
        const db = getServiceClient();
        // Upsert to avoid duplicates
        const { data, error } = await db
            .from("teacher_locations")
            .upsert({ teacher_id: teacherId, location_id: body.location_id }, { onConflict: "teacher_id,location_id", ignoreDuplicates: true })
            .select("id, location_id, created_at, locations(id, name, color)")
            .single();
        if (error)
            return serverError(error);
        return ok({ data });
    }
    catch (err) {
        return serverError(err);
    }
}
