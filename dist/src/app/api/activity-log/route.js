/**
 * POST /api/activity-log
 * Writes an entry to the activity_log table for a student, family, or other entity.
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
export const dynamic = "force-dynamic";
export async function POST(req) {
    var _a, _b, _c, _d;
    try {
        const tenantId = await getCRMTenantId();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = getServiceClient();
        const body = await req.json();
        if (!body.entity_type || !body.action) {
            return NextResponse.json({ error: "entity_type and action are required" }, { status: 400 });
        }
        const { data, error } = await db.from("activity_log").insert({
            tenant_id: tenantId,
            entity_type: body.entity_type,
            entity_id: (_a = body.entity_id) !== null && _a !== void 0 ? _a : null,
            entity_name: (_b = body.entity_name) !== null && _b !== void 0 ? _b : null,
            action: body.action,
            details: (_c = body.details) !== null && _c !== void 0 ? _c : null,
            location_id: (_d = body.location_id) !== null && _d !== void 0 ? _d : null,
        }).select().single();
        if (error)
            throw error;
        return NextResponse.json({ data });
    }
    catch (err) {
        console.error("[activity-log POST]", err);
        return NextResponse.json({ error: "Failed to write activity log" }, { status: 500 });
    }
}
