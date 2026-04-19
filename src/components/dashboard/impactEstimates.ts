/**
 * Optional rough money math for the dashboard. If unset, we only show counts — no fake dollars.
 * Set in `.env.local`, e.g. NEXT_PUBLIC_EST_ENROLLMENT_USD=160
 */
export function getOptionalEnrollmentUsd(): number | null {
  const raw = process.env.NEXT_PUBLIC_EST_ENROLLMENT_USD;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Admin time value per hour for "time saved" copy (USD). */
export function getOptionalAdminHourlyUsd(): number | null {
  const raw = process.env.NEXT_PUBLIC_EST_ADMIN_HOURLY_USD;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Assumed admin hours per new enrollment handled (follow-up, paperwork). */
export function getOptionalHoursPerEnrollment(): number {
  const raw = process.env.NEXT_PUBLIC_EST_HOURS_PER_ENROLLMENT;
  if (!raw) return 2;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 2;
}
