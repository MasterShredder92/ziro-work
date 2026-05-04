import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
// Average revenue per student per month (from pricing_tiers avg = $176)
const AVG_MONTHLY_REVENUE_PER_STUDENT = 17600; // cents
// Hire signal threshold: flag when a location has enough gap for a new teacher
const HIRE_SIGNAL_STUDENT_THRESHOLD = 12; // if gap >= 12 open slots, suggest hiring
// Max students per teacher (capacity target)
const MAX_STUDENTS_PER_TEACHER = 20;

export const dynamic = "force-dynamic";
export const revalidate = 60;

type HoursJson = Record<string, { open: string; close: string }>;

function calcWeeklySlots(hoursJson: HoursJson): number {
  // Each room: count open hours per week × 2 (30-min blocks per hour)
  let totalMinutes = 0;
  for (const day of Object.values(hoursJson)) {
    if (!day?.open || !day?.close) continue;
    const [oh, om] = day.open.split(":").map(Number);
    const [ch, cm] = day.close.split(":").map(Number);
    const mins = (ch * 60 + cm) - (oh * 60 + om);
    if (mins > 0) totalMinutes += mins;
  }
  return Math.floor(totalMinutes / 30); // 30-min slots per room per week
}

export async function GET() {
  const supabase = getServiceClient();

  // 1. Get all active locations with hours
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, color, hours_json")
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
  const result = locations.map((loc: { id: string; name: string; color: string | null; hours_json: unknown }) => {
    const locRooms = (rooms ?? []).filter((r: { location_id: string; primary_instruments: string[] | null; name: string }) => r.location_id === loc.id);
    const locStudents = (students ?? []).filter((s: { location_id: string | null; instrument: string | null }) => s.location_id === loc.id);
    const locTeachers = new Set(
      (teacherLocs ?? [])
        .filter((tl: { location_id: string; teacher_id: string; is_regular: boolean }) => tl.location_id === loc.id && tl.is_regular)
        .map((tl: { location_id: string; teacher_id: string; is_regular: boolean }) => tl.teacher_id)
    );

    const hoursJson = (loc.hours_json ?? {}) as HoursJson;
    const slotsPerRoomPerWeek = calcWeeklySlots(hoursJson);
    const slotsPerRoomPerMonth = Math.round(slotsPerRoomPerWeek * 4.33);

    const totalCapacity = locRooms.length * slotsPerRoomPerMonth;
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
      instrumentMap[primary].gap += slotsPerRoomPerMonth;
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
    const shouldHire = studentsPerTeacher >= MAX_STUDENTS_PER_TEACHER - 2 || gap >= HIRE_SIGNAL_STUDENT_THRESHOLD * 2;
    const hireInstrument = instruments[0]?.name ?? null; // highest gap instrument

    const fillPct = totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0;

    return {
      locationId: loc.id,
      locationName: loc.name,
      locationColor: loc.color ?? "#00ff88",
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
