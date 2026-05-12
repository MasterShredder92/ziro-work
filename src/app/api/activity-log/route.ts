/**
 * POST /api/activity-log — append a row (schedule, CRM, etc.).
 * GET ?familyId= — CRM family timeline: family + linked students' activity (crm.read).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
import { resolveCRMContext } from "@/app/api/crm/_context";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const familyId = req.nextUrl.searchParams.get("familyId");
  if (!familyId?.trim()) {
    return NextResponse.json({ error: "familyId query parameter is required" }, { status: 400 });
  }

  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "family",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { tenantId } = resolved.context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getServiceClient() as any;

    const { data: students, error: stErr } = await db
      .from("students")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("family_id", familyId.trim());
    if (stErr) throw stErr;
    const studentIds = (students ?? []).map((s: { id: string }) => s.id);

    const { data: familyRows, error: famErr } = await db
      .from("activity_log")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entity_type", "family")
      .eq("entity_id", familyId.trim())
      .order("created_at", { ascending: false })
      .limit(150);
    if (famErr) throw famErr;

    let studentRows: Record<string, unknown>[] = [];
    if (studentIds.length > 0) {
      const { data: sr, error: srErr } = await db
        .from("activity_log")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("entity_type", "student")
        .in("entity_id", studentIds)
        .order("created_at", { ascending: false })
        .limit(200);
      if (srErr) throw srErr;
      studentRows = sr ?? [];
    }

    const merged = [...(familyRows ?? []), ...studentRows].sort(
      (a, b) =>
        new Date(String((b as { created_at: string }).created_at)).getTime() -
        new Date(String((a as { created_at: string }).created_at)).getTime()
    );
    const seen = new Set<string>();
    const items = merged.filter((row) => {
      const id = String((row as { id: string }).id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 250);

    return NextResponse.json({ data: { items } });
  } catch (err) {
    console.error("[activity-log GET]", err);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}

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
