import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const dynamic = "force-dynamic";

/**
 * Agent State Endpoint — SOVEREIGN SCHEMA
 *
 * Used by agents in the Tool Loop "Observe" step.
 * Returns the current state of the studio so agents can
 * understand what they're working with before taking action.
 *
 * GET /api/agent/state?locationName=Bellevue&type=schedule|students|overview
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const locationName = searchParams.get("locationName");
    const type = searchParams.get("type") || "overview";
    const tenantId = DEFAULT_TENANT_ID;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    if (type === "schedule") {
      let query = supabase
        .from("schedule_blocks")
        .select(`
          id, start_time, end_time, block_type, status,
          teacher:teachers(first_name, last_name),
          student:students(first_name, last_name),
          location:locations(name)
        `)
        .eq("tenant_id", tenantId)
        .gte("start_time", todayStart)
        .lte("end_time", todayEnd)
        .order("start_time", { ascending: true });

      if (locationName) {
        query = query.eq("location_name", locationName);
      }

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ type: "schedule", date: todayStart, blocks: data, count: data?.length || 0 });
    }

    if (type === "students") {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, status, instrument")
        .eq("tenant_id", tenantId)
        .eq("status", "active");

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ type: "students", students: data, count: data?.length || 0 });
    }

    // Default: overview
    const [blocksRes, studentsRes, teachersRes] = await Promise.all([
      supabase
        .from("schedule_blocks")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .gte("start_time", todayStart)
        .lte("end_time", todayEnd),
      supabase
        .from("students")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("status", "active"),
      supabase
        .from("teachers")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("status", "active"),
    ]);

    return NextResponse.json({
      type: "overview",
      tenantId,
      timestamp: new Date().toISOString(),
      today: {
        scheduleBlocks: blocksRes.data?.length || 0,
        activeStudents: studentsRes.data?.length || 0,
        activeTeachers: teachersRes.data?.length || 0,
      },
    });

  } catch (error: any) {
    console.error("[Agent State Error]:", error);
    return NextResponse.json({ error: "Failed to retrieve state" }, { status: 500 });
  }
}
