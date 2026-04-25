import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("location_id");
  const dayOfWeekParam = searchParams.get("day_of_week");

  if (!locationId || dayOfWeekParam === null) {
    return NextResponse.json(
      { error: "location_id and day_of_week are required" },
      { status: 400 }
    );
  }

  const dayOfWeek = parseInt(dayOfWeekParam, 10);
  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json(
      { error: "day_of_week must be an integer 0–6" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("recurring_lessons")
    .select(
      `
      id,
      student_id,
      teacher_id,
      location_id,
      day_of_week,
      start_time,
      end_time,
      instrument,
      is_active,
      effective_from,
      effective_until,
      students!inner (
        id,
        first_name,
        last_name,
        instrument
      )
    `
    )
    .eq("location_id", locationId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .or("effective_until.is.null,effective_until.gte." + new Date().toISOString().split("T")[0]);

  if (error) {
    console.error("[recurring-lessons] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten student fields onto each row
  const rows = (data ?? []).map((row: Record<string, unknown>) => {
    const student = row.students as { id: string; first_name: string; last_name: string; instrument: string | null } | null;
    return {
      id: row.id,
      student_id: row.student_id,
      teacher_id: row.teacher_id,
      location_id: row.location_id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      instrument: (student?.instrument ?? row.instrument) as string | null,
      student_first_name: student?.first_name ?? null,
      student_last_name: student?.last_name ?? null,
    };
  });

  return NextResponse.json({ data: rows });
}
