import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Agent State Endpoint
 * 
 * Used by agents in the Tool Loop "Observe" step.
 * Returns the current state of the studio so agents can
 * understand what they're working with before taking action.
 * 
 * GET /api/agent/state?studioId=xxx&type=schedule|students|finances
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studioId = searchParams.get("studioId");
    const type = searchParams.get("type") || "overview";

    if (!studioId) {
      return NextResponse.json(
        { error: "studioId is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    if (type === "schedule") {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          id, start_time, end_time, status,
          student:students(first_name, last_name),
          instructor:instructors(first_name, last_name),
          room:rooms(name)
        `)
        .eq("studio_id", studioId)
        .gte("start_time", todayStart)
        .lte("end_time", todayEnd)
        .order("start_time", { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ type: "schedule", date: todayStart, lessons: data, count: data?.length || 0 });
    }

    if (type === "students") {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, status, skill_level, instrument")
        .eq("studio_id", studioId)
        .eq("status", "active");

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ type: "students", students: data, count: data?.length || 0 });
    }

    // Default: overview
    const [lessonsRes, studentsRes, instructorsRes] = await Promise.all([
      supabase.from("lessons").select("id, status").eq("studio_id", studioId).gte("start_time", todayStart).lte("end_time", todayEnd),
      supabase.from("students").select("id, status").eq("studio_id", studioId).eq("status", "active"),
      supabase.from("instructors").select("id, status").eq("studio_id", studioId).eq("status", "active"),
    ]);

    return NextResponse.json({
      type: "overview",
      studioId,
      timestamp: new Date().toISOString(),
      today: {
        lessons: lessonsRes.data?.length || 0,
        activeStudents: studentsRes.data?.length || 0,
        activeInstructors: instructorsRes.data?.length || 0,
      },
    });

  } catch (error: any) {
    console.error("[Agent State Error]:", error);
    return NextResponse.json({ error: "Failed to retrieve state" }, { status: 500 });
  }
}
