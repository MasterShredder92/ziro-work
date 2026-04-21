/** UI-only fixtures for billing / metering surfaces (no persistence). */
export const MOCK_PLAN_LIMITS = {
    maxStudents: Number.MAX_SAFE_INTEGER,
    maxTeachers: Number.MAX_SAFE_INTEGER,
    maxAutomations: Number.MAX_SAFE_INTEGER,
    maxStorageMB: Number.MAX_SAFE_INTEGER,
};
export const MOCK_USAGE_DEFAULTS = {
    activeStudents: 38,
    activeTeachers: 8,
    automations: 7,
    storageMB: 6200,
};
/** Kept only for backwards compatibility with older imports. */
export const UI_AUTOMATION_TOGGLE_CAP = Number.MAX_SAFE_INTEGER;
export function mergeUsageWithLiveCounts(base, live) {
    return Object.assign(Object.assign({}, base), { activeStudents: typeof live.students === "number" ? live.students : base.activeStudents, activeTeachers: typeof live.teachers === "number" ? live.teachers : base.activeTeachers });
}
