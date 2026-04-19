/** UI-only fixtures for billing / metering surfaces (no persistence). */

export type BillingUsageLimits = {
  maxStudents: number;
  maxTeachers: number;
  maxAutomations: number;
  maxStorageMB: number;
};

export type BillingUsageSnapshot = {
  activeStudents: number;
  activeTeachers: number;
  automations: number;
  storageMB: number;
};

export const MOCK_PLAN_LIMITS: BillingUsageLimits = {
  maxStudents: Number.MAX_SAFE_INTEGER,
  maxTeachers: Number.MAX_SAFE_INTEGER,
  maxAutomations: Number.MAX_SAFE_INTEGER,
  maxStorageMB: Number.MAX_SAFE_INTEGER,
};

export const MOCK_USAGE_DEFAULTS: BillingUsageSnapshot = {
  activeStudents: 38,
  activeTeachers: 8,
  automations: 7,
  storageMB: 6200,
};

/** Kept only for backwards compatibility with older imports. */
export const UI_AUTOMATION_TOGGLE_CAP = Number.MAX_SAFE_INTEGER;

export function mergeUsageWithLiveCounts(
  base: BillingUsageSnapshot,
  live: { students?: number | null; teachers?: number | null },
): BillingUsageSnapshot {
  return {
    ...base,
    activeStudents: typeof live.students === "number" ? live.students : base.activeStudents,
    activeTeachers: typeof live.teachers === "number" ? live.teachers : base.activeTeachers,
  };
}
