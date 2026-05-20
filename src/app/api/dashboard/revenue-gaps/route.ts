import { NextResponse } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
// Average revenue per student per month (from pricing_tiers avg = $176)
const AVG_MONTHLY_REVENUE_PER_STUDENT = 17600; // cents
// Practical capacity: each room can support 1 teacher × 20 students
const STUDENTS_PER_ROOM_CAPACITY = 20;
// Hire signal: when students/teacher ratio is >= this, suggest hiring
const HIRE_SIGNAL_RATIO = 18;

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  const supabase = await createTenantBoundSupabaseClient();

  // 1. Get all active locations with hours
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, color")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true)
    .order("name");

  if (!locations?.length) {
    return NextResponse.json({ locations: [] });
  }

  // 2. Get all active rooms per location with instruments
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, location_id, primary_instruments, name")
    .eq("tenant_id", TENANT_ID)
    .eq("is_active", true);

  // 3. Get active student counts per location + instrument
  const { data: students } = await supabase
    .from("students")
    .select("location_id, instrument")
    .eq("tenant_id", TENANT_ID)
    .eq("status", "active");

  // 4. Get active teacher counts per location
  const { data: teacherLocs } = await supabase
    .from("teacher_locations")
    .select("location_id, teacher_id, is_regular");

  // 5. Get average rate from pricing_tiers
  const { data: rateData } = await supabase
    .from("families")
    .select("rate_tier")
    .eq("tenant_id", TENANT_ID)
    .gt("rate_tier", 0)
    .not("rate_tier", "is", null);

  const avgRate = rateData?.length
    ? Math.round(rateData.reduce((s: number, f: { rate_tier: number | null }) => s + (f.rate_tier ?? 0), 0) / rateData.length * 4.33)
    : AVG_MONTHLY_REVENUE_PER_STUDENT;

  // Build per-location data
  const result = locations.map((loc: { id: string; name: string; color: string | null }) => {
    const locRooms = (rooms ?? []).filter((r: { location_id: string; primary_instruments: string[] | null; name: string }) => r.location_id === loc.id);
    const locStudents = (students ?? []).filter((s: { location_id: string | null; instrument: string | null }) => s.location_id === loc.id);
    const locTeachers = new Set(
      (teacherLocs ?? [])
        .filter((tl: { location_id: string; teacher_id: string; is_regular: boolean }) => tl.location_id === loc.id && tl.is_regular)
        .map((tl: { location_id: string; teacher_id: string; is_regular: boolean }) => tl.teacher_id)
    );

    // Practical capacity: rooms × 20 students per room (1 teacher per room, 20 students per teacher)
    const totalCapacity = locRooms.length * STUDENTS_PER_ROOM_CAPACITY;
    const occupied = locStudents.length;
    const gap = Math.max(0, totalCapacity - occupied);
    const revenueLostCents = gap * avgRate;

    // Instrument breakdown
    const instrumentMap: Record<string, { rooms: number; students: number; gap: number }> = {};
    for (const room of locRooms) {
      const instruments = room.primary_instruments ?? [];
      // Use first instrument as primary
      const primary = instruments[0] ?? "other";
      if (!instrumentMap[primary]) instrumentMap[primary] = { rooms: 0, students: 0, gap: 0 };
      instrumentMap[primary].rooms += 1;
      instrumentMap[primary].gap += STUDENTS_PER_ROOM_CAPACITY;
    }
    for (const student of locStudents) {
      const inst = (student.instrument ?? "other").toLowerCase();
      if (!instrumentMap[inst]) instrumentMap[inst] = { rooms: 0, students: 0, gap: 0 };
      instrumentMap[inst].students += 1;
      instrumentMap[inst].gap = Math.max(0, instrumentMap[inst].gap - 1);
    }

    const instruments = Object.entries(instrumentMap)
      .map(([name, d]) => ({
        name,
        rooms: d.rooms,
        students: d.students,
        openSlots: d.gap,
        revenueLostCents: d.gap * avgRate,
      }))
      .sort((a, b) => b.revenueLostCents - a.revenueLostCents);

    // Hire signal
    const teacherCount = locTeachers.size;
    const studentsPerTeacher = teacherCount > 0 ? Math.round(occupied / teacherCount) : 0;
    const shouldHire = studentsPerTeacher >= HIRE_SIGNAL_RATIO || (gap > 0 && teacherCount > 0 && studentsPerTeacher >= HIRE_SIGNAL_RATIO - 2);
    const hireInstrument = instruments[0]?.name ?? null; // highest gap instrument

    const fillPct = totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0;

    return {
      locationId: loc.id,
      locationName: loc.name,
      locationColor: loc.color ?? "#c4f036",
      totalRooms: locRooms.length,
      totalCapacity,
      occupied,
      gap,
      fillPct,
      revenueLostCents,
      avgMonthlyPerStudentCents: avgRate,
      teacherCount,
      studentsPerTeacher,
      shouldHire,
      hireInstrument,
      instruments,
    };
  });

  // Sort by revenue lost descending (biggest gap first)
  result.sort((a: { revenueLostCents: number }, b: { revenueLostCents: number }) => b.revenueLostCents - a.revenueLostCents);

  return NextResponse.json(
    { locations: result, avgMonthlyPerStudentCents: avgRate },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
