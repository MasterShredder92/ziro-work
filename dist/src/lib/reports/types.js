/**
 * Reporting OS — shared type contracts.
 *
 * Consumed by the report definition registry, the runtime service,
 * the API routes, and the UI renderers. No runtime side effects.
 */
export const REPORT_KIND_LIST = [
    "enrollment",
    "revenue",
    "attendance",
    "teacherLoad",
    "leadConversion",
];
export const REPORT_SOURCES = [
    "students",
    "families",
    "teachers",
    "leads",
    "schedule_blocks",
    "lesson_events",
    "attendance_sessions",
    "invoices",
    "payments",
    "subscriptions",
    "progress_goals",
    "progress_skills",
    "progress_checkpoints",
    "progress_evidence",
    "assessments",
    "assessment_attempts",
    "forms",
    "form_submissions",
    "message_threads",
    "messages",
    "automation_runs",
    "automation_logs",
];
