/**
 * Scheduling & Calendar OS - core types.
 *
 * These types describe the new event-based scheduling layer that sits alongside
 * the existing `schedule_blocks` / `session_log` tables. Where possible,
 * LessonEvent maps 1:1 with the legacy `schedule_blocks` row so integrations
 * with Attendance OS / Billing OS / Messaging OS are transparent.
 */
export {};
