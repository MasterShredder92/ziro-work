/**
 * Reporting OS — unified source registry.
 *
 * Every report source is a tenant-scoped fetcher that returns a normalized
 * array of records. These fetchers wrap the existing @data/* facades so the
 * reporting layer never talks to Supabase directly.
 *
 * Datasets are intentionally fetched in full (with a hard safety cap) and
 * then post-processed by the query engine. This keeps the reporting model
 * consistent across sources while the schema stabilizes.
 */

import "server-only";

import { listStudents } from "@data/students";
import { listFamilies } from "@data/families";
import { listTeachers } from "@data/teachers";
import { listLeads } from "@data/leads";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listLessonEvents } from "@data/lessonEvents";
import { listAttendanceSessions } from "@data/attendanceSessions";
import { listInvoices } from "@data/invoices";
import { listPayments } from "@data/payments";
import { listSubscriptions } from "@data/subscriptions";
import { listGoals } from "@data/progressGoals";
import { listSkills } from "@data/progressSkills";
import { listCheckpoints } from "@data/progressCheckpoints";
import { listEvidence } from "@data/progressEvidence";
import { listAssessments } from "@data/assessments";
import { listAssessmentAttempts } from "@data/assessmentAttempts";
import { listForms, listFormSubmissions } from "@data/forms";
import { listThreads } from "@data/messageThreads";
import { listMessages } from "@data/messageRecords";
import { listAutomationRuns } from "@data/automationRuns";
import { listAutomationLogs } from "@data/automationLogs";

import type { ReportSource } from "./types";

const SAFETY_LIMIT = 5000;

type SourceRecord = Record<string, unknown>;
type Fetcher = (tenantId: string) => Promise<SourceRecord[]>;

async function safeFetch(fn: () => Promise<unknown[]>): Promise<SourceRecord[]> {
  try {
    const rows = await fn();
    return (rows ?? []) as SourceRecord[];
  } catch {
    return [];
  }
}

const SOURCE_FETCHERS: Record<ReportSource, Fetcher> = {
  students: (t) =>
    safeFetch(() => listStudents(t, undefined, { limit: SAFETY_LIMIT })),
  families: (t) =>
    safeFetch(() => listFamilies(t, undefined, { limit: SAFETY_LIMIT })),
  teachers: (t) =>
    safeFetch(() => listTeachers(t, undefined, { limit: SAFETY_LIMIT })),
  leads: (t) =>
    safeFetch(() => listLeads(t, undefined, { limit: SAFETY_LIMIT })),
  schedule_blocks: (t) =>
    safeFetch(() => listScheduleBlocks(t, undefined, { limit: SAFETY_LIMIT })),
  lesson_events: (t) =>
    safeFetch(() => listLessonEvents(t, undefined, { limit: SAFETY_LIMIT })),
  attendance_sessions: (t) =>
    safeFetch(() =>
      listAttendanceSessions({}, t, { limit: SAFETY_LIMIT }),
    ),
  invoices: (t) =>
    safeFetch(() => listInvoices(t, undefined, { limit: SAFETY_LIMIT })),
  payments: (t) =>
    safeFetch(() => listPayments(t, undefined, { limit: SAFETY_LIMIT })),
  subscriptions: (t) =>
    safeFetch(() => listSubscriptions(t, undefined, { limit: SAFETY_LIMIT })),
  progress_goals: (t) =>
    safeFetch(() => listGoals({}, t, { limit: SAFETY_LIMIT })),
  progress_skills: (t) =>
    safeFetch(() => listSkills({}, t, { limit: SAFETY_LIMIT })),
  progress_checkpoints: (t) =>
    safeFetch(() => listCheckpoints({}, t, { limit: SAFETY_LIMIT })),
  progress_evidence: (t) =>
    safeFetch(() => listEvidence({}, t, { limit: SAFETY_LIMIT })),
  assessments: (t) =>
    safeFetch(() => listAssessments(t, undefined, { limit: SAFETY_LIMIT })),
  assessment_attempts: (t) =>
    safeFetch(() =>
      listAssessmentAttempts({}, t, { limit: SAFETY_LIMIT }),
    ),
  forms: (t) => safeFetch(() => listForms(t)),
  form_submissions: (t) => safeFetch(() => listFormSubmissions(t)),
  message_threads: (t) =>
    safeFetch(() => listThreads(t, undefined, { limit: SAFETY_LIMIT })),
  messages: (t) =>
    safeFetch(() => listMessages(t, undefined, { limit: SAFETY_LIMIT })),
  automation_runs: (t) =>
    safeFetch(() => listAutomationRuns(t, undefined, { limit: SAFETY_LIMIT })),
  automation_logs: (t) =>
    safeFetch(() => listAutomationLogs(t, undefined, { limit: SAFETY_LIMIT })),
};

/**
 * Fetch all rows for a source, tenant-scoped. Errors are swallowed and
 * treated as empty datasets — the query engine should remain robust when
 * optional schemas are absent.
 */
export async function fetchSource(
  source: ReportSource,
  tenantId: string,
): Promise<SourceRecord[]> {
  const fetcher = SOURCE_FETCHERS[source];
  if (!fetcher) return [];
  return fetcher(tenantId);
}

export function isKnownSource(v: string): v is ReportSource {
  return v in SOURCE_FETCHERS;
}
