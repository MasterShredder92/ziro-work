export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';
import { fetchLocationHours } from '@/lib/schedule/locationHours';
import { getHoursForDate } from '@/lib/schedule/locationHoursUtils';

const BELLEVUE_ID = 'f7b52dd5-12ee-437f-9c60-f8adf454ac31';
const SUNDAY = '2026-04-26';

export async function GET() {
  const supabase = getServiceClient();

  // 1. Fetch location_hours
  const locationHours = await fetchLocationHours(BELLEVUE_ID);
  const dayHours = getHoursForDate(locationHours, SUNDAY);

  // 2. Fetch schedule_blocks for Sunday
  const { data: blocks, error } = await supabase
    .from('schedule_blocks')
    .select('id, block_date, start_time, end_time, teacher_id, student_id, room_id, is_recurring, block_type')
    .eq('location_id', BELLEVUE_ID)
    .eq('block_date', SUNDAY)
    .not('student_id', 'is', null)
    .limit(5);

  // 3. Simulate projectBlocksForWindow
  const projected = (blocks ?? []).map(b => ({
    id: b.is_recurring ? `${b.id}:${SUNDAY}` : b.id,
    block_date: b.block_date,
    start_time: b.start_time,
    teacher_id: b.teacher_id,
    student_id: b.student_id,
    room_id: b.room_id,
    is_recurring: b.is_recurring,
    block_type: b.block_type,
  }));

  return NextResponse.json({
    locationHours,
    dayHours,
    isClosed: dayHours.isClosed,
    blockCount: blocks?.length ?? 0,
    sampleProjected: projected.slice(0, 3),
    error: error?.message ?? null,
  });
}
