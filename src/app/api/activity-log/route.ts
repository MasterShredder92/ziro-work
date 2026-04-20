/**
 * POST /api/activity-log
 * Writes an entry to the activity_log table for a student, family, or other entity.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getServiceClient() as any;

    const body = await req.json() as {
      entity_type: string;
      entity_id?: string;
      entity_name?: string;
      action: string;
      details?: string;
      location_id?: string;
    };

    if (!body.entity_type || !body.action) {
      return NextResponse.json({ error: "entity_type and action are required" }, { status: 400 });
    }

    const { data, error } = await db.from("activity_log").insert({
      tenant_id: tenantId,
      entity_type: body.entity_type,
      entity_id: body.entity_id ?? null,
      entity_name: body.entity_name ?? null,
      action: body.action,
      details: body.details ?? null,
      location_id: body.location_id ?? null,
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[activity-log POST]", err);
    return NextResponse.json({ error: "Failed to write activity log" }, { status: 500 });
  }
}
