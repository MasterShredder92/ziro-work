/** Shared URL sort parsing + DB column mapping for CRM list server pages. */

export function parseTableSort<P extends string>(
  sort: string | undefined,
  dir: string | undefined,
  allowed: readonly P[],
): { key: P | null; dir: "asc" | "desc" | null } {
  if (!sort || !allowed.includes(sort as P)) return { key: null, dir: null };
  if (dir !== "asc" && dir !== "desc") return { key: null, dir: null };
  return { key: sort as P, dir };
}

/** Students list — UI column key → students table column */
export const STUDENT_SORT_KEYS = [
  "name",
  "status",
  "instrument",
  "teacher",
  "family",
  "studio",
  "rate",
  "paid",
] as const;

export function studentSortOrder(
  key: (typeof STUDENT_SORT_KEYS)[number] | null,
  dir: "asc" | "desc" | null,
): { orderBy: string; ascending: boolean } {
  const ascending = dir === "asc";
  switch (key) {
    case "name":
      return { orderBy: "last_name", ascending };
    case "status":
      return { orderBy: "status", ascending };
    case "instrument":
      return { orderBy: "instrument", ascending };
    case "teacher":
      return { orderBy: "last_teacher_name", ascending };
    case "family":
      return { orderBy: "family_id", ascending };
    case "studio":
      return { orderBy: "location_id", ascending };
    case "rate":
      return { orderBy: "rate_per_session", ascending };
    case "paid":
      return { orderBy: "total_paid", ascending };
    default:
      return { orderBy: "created_at", ascending: false };
  }
}

export const FAMILY_SORT_KEYS = [
  "family",
  "primary_contact",
  "balance",
  "email",
  "phone",
  "studio",
  "lifetime_paid",
] as const;

export function familySortOrder(
  key: (typeof FAMILY_SORT_KEYS)[number] | null,
  dir: "asc" | "desc" | null,
): { orderBy: string; ascending: boolean } {
  const ascending = dir === "asc";
  switch (key) {
    case "family":
      return { orderBy: "name", ascending };
    case "primary_contact":
      return { orderBy: "parent_last_name", ascending };
    case "balance":
      return { orderBy: "balance", ascending };
    case "email":
      return { orderBy: "primary_email", ascending };
    case "phone":
      return { orderBy: "primary_phone", ascending };
    case "studio":
      return { orderBy: "primary_location_id", ascending };
    case "lifetime_paid":
      return { orderBy: "lifetime_paid_cents", ascending };
    default:
      return { orderBy: "created_at", ascending: false };
  }
}

export const TEACHER_SORT_KEYS = [
  "name",
  "status",
  "active",
  "email",
] as const;

export function teacherSortOrder(
  key: (typeof TEACHER_SORT_KEYS)[number] | null,
  dir: "asc" | "desc" | null,
): { orderBy: string; ascending: boolean } {
  const ascending = dir === "asc";
  switch (key) {
    case "name":
      return { orderBy: "last_name", ascending };
    case "status":
      return { orderBy: "status", ascending };
    case "active":
      return { orderBy: "is_active", ascending };
    case "email":
      return { orderBy: "email", ascending };
    default:
      return { orderBy: "created_at", ascending: false };
  }
}

export const ENROLLMENT_SORT_KEYS = [
  "status",
  "start",
  "end",
  "updated",
] as const;

export function enrollmentSortOrder(
  key: (typeof ENROLLMENT_SORT_KEYS)[number] | null,
  dir: "asc" | "desc" | null,
): { orderBy: string; ascending: boolean } {
  const ascending = dir === "asc";
  switch (key) {
    case "status":
      return { orderBy: "status", ascending };
    case "start":
      return { orderBy: "start_date", ascending };
    case "end":
      return { orderBy: "end_date", ascending };
    case "updated":
      return { orderBy: "updated_at", ascending };
    default:
      return { orderBy: "created_at", ascending: false };
  }
}
