import type { StudentScheduleEntry } from "./schedulingIntegration";

const DAY_ORDER: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

function dayRank(day: string | null): number {
  if (!day) return 99;
  const k = day.trim().toLowerCase();
  return DAY_ORDER[k] ?? 99;
}

/**
 * Read-only “next lesson” line from recurring-style blocks (day + local times).
 * Picks the earliest weekday in the week, then earliest start time.
 */
export function summarizeNextLesson(
  entries: StudentScheduleEntry[],
): string | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => {
    const da = dayRank(a.dayOfWeek);
    const db = dayRank(b.dayOfWeek);
    if (da !== db) return da - db;
    const ta = a.startsAt ?? "";
    const tb = b.startsAt ?? "";
    return ta.localeCompare(tb);
  });
  const s = sorted[0];
  const day = s.dayOfWeek ?? "Lesson";
  const span =
    s.startsAt && s.endsAt
      ? `${s.startsAt}–${s.endsAt}`
      : (s.startsAt ?? s.endsAt ?? "");
  return span ? `${day} · ${span}` : day;
}
