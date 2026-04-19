import "server-only";
import { getServiceClient } from "@/lib/supabase";

export type LocationHoursRow = {
  day_of_week: number; // 0=Sun, 1=Mon, ... 6=Sat
  open_time: string;   // "HH:MM:SS"
  close_time: string;  // "HH:MM:SS"
  is_closed: boolean;
};

export type LocationHoursMap = Record<number, { openMinute: number; closeMinute: number; isClosed: boolean }>;

function toMinute(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}

export async function fetchLocationHours(locationId: string): Promise<LocationHoursMap> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("location_hours")
    .select("day_of_week, open_time, close_time, is_closed")
    .eq("location_id", locationId);

  if (error || !data || data.length === 0) {
    // Default fallback: 3pm–9pm Mon–Thu, 10am–4pm Sat, closed Fri+Sun
    return {
      0: { openMinute: 0, closeMinute: 0, isClosed: true },
      1: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false },
      2: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false },
      3: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false },
      4: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false },
      5: { openMinute: 0, closeMinute: 0, isClosed: true },
      6: { openMinute: 10 * 60, closeMinute: 16 * 60, isClosed: false },
    };
  }

  const map: LocationHoursMap = {};
  for (const row of data) {
    map[row.day_of_week] = {
      openMinute: toMinute(row.open_time),
      closeMinute: toMinute(row.close_time),
      isClosed: row.is_closed ?? false,
    };
  }
  return map;
}

/** Returns the open/close minutes for a given ISO date string (YYYY-MM-DD) */
export function getHoursForDate(
  map: LocationHoursMap,
  isoDate: string
): { openMinute: number; closeMinute: number; isClosed: boolean } {
  const dow = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay(); // 0=Sun
  return map[dow] ?? { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false };
}
