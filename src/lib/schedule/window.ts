export type ScheduleWindow = {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 14;

function toUtcDate(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function toIsoDate(value: Date): string {
  return toUtcDate(value).toISOString().slice(0, 10);
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addDays(isoDate: string, days: number): string {
  const next = new Date(parseIsoDate(isoDate).getTime() + days * DAY_MS);
  return toIsoDate(next);
}

export function twoWeekWindowFrom(startIso: string): ScheduleWindow {
  return { start: startIso, end: addDays(startIso, WINDOW_DAYS - 1) };
}

export function twoWeekWindowFromToday(): ScheduleWindow {
  return twoWeekWindowFrom(toIsoDate(new Date()));
}

/** Returns a Monday-anchored 7-day window (Mon-Sun) containing the given date */
export function weekWindowContaining(isoDate: string): ScheduleWindow {
  const d = parseIsoDate(isoDate);
  const dow = d.getUTCDay(); // 0=Sun
  const daysToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = toIsoDate(new Date(d.getTime() + daysToMonday * DAY_MS));
  return { start: monday, end: addDays(monday, 6) };
}

export function weekWindowFromToday(): ScheduleWindow {
  return weekWindowContaining(toIsoDate(new Date()));
}

export function shiftWindowByOneWeek(startIso: string, direction: 1 | -1): ScheduleWindow {
  return weekWindowContaining(addDays(startIso, direction * 7));
}

export function shiftWindowByWeeks(startIso: string, weeks: number): ScheduleWindow {
  return twoWeekWindowFrom(addDays(startIso, weeks * 7));
}

export function eachDayInclusive(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = parseIsoDate(startIso).getTime();
  const end = parseIsoDate(endIso).getTime();
  for (let t = start; t <= end; t += DAY_MS) {
    out.push(toIsoDate(new Date(t)));
  }
  return out;
}

export function clampWindowLength(window: ScheduleWindow, maxDays = WINDOW_DAYS): boolean {
  const start = parseIsoDate(window.start).getTime();
  const end = parseIsoDate(window.end).getTime();
  const spanDays = Math.floor((end - start) / DAY_MS) + 1;
  return spanDays > 0 && spanDays <= maxDays;
}
