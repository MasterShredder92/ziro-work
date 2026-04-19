/**
 * Client-safe location hours utilities.
 * No server-only imports — safe to use in both Server and Client Components.
 */

export type LocationHoursMap = Record<
  number,
  { openMinute: number; closeMinute: number; isClosed: boolean }
>;

/** Returns the open/close minutes for a given ISO date string (YYYY-MM-DD) */
export function getHoursForDate(
  map: LocationHoursMap,
  isoDate: string,
): { openMinute: number; closeMinute: number; isClosed: boolean } {
  const dow = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay(); // 0=Sun
  return map[dow] ?? { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false };
}

/** Default fallback hours when no location_hours data is available */
export const DEFAULT_LOCATION_HOURS: LocationHoursMap = {
  0: { openMinute: 0, closeMinute: 0, isClosed: true },        // Sun closed
  1: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false }, // Mon 3-9
  2: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false }, // Tue 3-9
  3: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false }, // Wed 3-9
  4: { openMinute: 15 * 60, closeMinute: 21 * 60, isClosed: false }, // Thu 3-9
  5: { openMinute: 0, closeMinute: 0, isClosed: true },        // Fri closed
  6: { openMinute: 10 * 60, closeMinute: 16 * 60, isClosed: false }, // Sat 10-4
};
