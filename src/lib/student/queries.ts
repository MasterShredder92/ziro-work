import "server-only";
import { getStudentById } from "@data/students";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import { listSessionLog } from "@data/sessionLog";
import { listAIConversations } from "@data/aiConversations";
import {
  listSquareInvoices,
  listSquarePayments,
} from "@data/squareInvoices";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import type {
  AIConversation,
  ScheduleBlock,
  SessionLog,
  SquareInvoice,
  SquarePayment,
  Student,
} from "@/lib/types/entities";
import type {
  StudentBillingItem,
  StudentBillingSummary,
  StudentLessonItem,
  StudentMessageItem,
  StudentScheduleItem,
} from "./types";

const SCHEDULE_PAST_DAYS = 14;
const SCHEDULE_FUTURE_DAYS = 60;
const LESSON_HISTORY_DAYS = 180;

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function resolveTenantForStudent(
  studentId: string,
  tenantId?: string,
): Promise<string> {
  if (tenantId && tenantId.trim().length > 0) return tenantId.trim();
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("students")
    .select("tenant_id")
    .eq("id", studentId)
    .maybeSingle();
  if (error) throw error;
  const t = (data?.tenant_id as string | undefined) ?? DEFAULT_TENANT_ID;
  return t;
}

async function resolveProfileIdForStudent(
  studentId: string,
  tenantId: string,
): Promise<string | null> {
  const student = await getStudentById(studentId, tenantId);
  if (!student) return null;
  const row = student as unknown as Record<string, unknown>;
  return (row["profile_id"] as string | null | undefined) ?? null;
}

export async function getStudentProfile(
  studentId: string,
  tenantId?: string,
): Promise<Student | null> {
  const tid = await resolveTenantForStudent(studentId, tenantId);
  return getStudentById(studentId, tid);
}

export async function getStudentByProfileId(
  profileId: string,
): Promise<Student | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Student | null;
}

export async function getStudentSchedule(
  studentId: string,
  tenantId?: string,
): Promise<StudentScheduleItem[]> {
  const tid = await resolveTenantForStudent(studentId, tenantId);
  const rows: ScheduleBlock[] = await listScheduleBlocks(
    tid,
    {
      student_id: studentId,
      date_from: isoDate(-SCHEDULE_PAST_DAYS),
      date_to: isoDate(SCHEDULE_FUTURE_DAYS),
    },
    { orderBy: "block_date", ascending: true, limit: 500 },
  );
  return rows.map(toScheduleItem);
}

export async function getStudentLessons(
  studentId: string,
  tenantId?: string,
): Promise<StudentLessonItem[]> {
  const tid = await resolveTenantForStudent(studentId, tenantId);
  const rows: SessionLog[] = await listSessionLog(
    tid,
    {
      student_id: studentId,
      date_from: isoDate(-LESSON_HISTORY_DAYS),
      date_to: isoDate(0),
    },
    { orderBy: "block_date", ascending: false, limit: 100 },
  );
  return rows.map(toLessonItem);
}

export async function getStudentMessages(
  studentId: string,
  tenantId?: string,
): Promise<StudentMessageItem[]> {
  const tid = await resolveTenantForStudent(studentId, tenantId);
  const profileId = await resolveProfileIdForStudent(studentId, tid);
  if (!profileId) return [];
  const rows: AIConversation[] = await listAIConversations(
    tid,
    { profile_id: profileId },
    { orderBy: "updated_at", ascending: false, limit: 50 },
  );
  return rows.map(toMessageItem);
}

export async function getStudentBilling(
  studentId: string,
  tenantId?: string,
): Promise<{
  items: StudentBillingItem[];
  payments: SquarePayment[];
  summary: StudentBillingSummary;
}> {
  const tid = await resolveTenantForStudent(studentId, tenantId);
  const student = await getStudentById(studentId, tid);
  const familyId =
    student
      ? ((student as unknown as Record<string, unknown>)["family_id"] as
          | string
          | null
          | undefined) ?? null
      : null;

  const [invoices, payments] = await Promise.all([
    listSquareInvoices(
      tid,
      undefined,
      { orderBy: "invoice_date", ascending: false, limit: 200 },
    ),
    listSquarePayments(tid, { limit: 200 }),
  ]);

  const scopedInvoices = familyId
    ? invoices.filter(
        (inv) =>
          ((inv as unknown as Record<string, unknown>)["family_id"] as
            | string
            | null
            | undefined) === familyId,
      )
    : invoices.filter(
        (inv) =>
          ((inv as unknown as Record<string, unknown>)["student_id"] as
            | string
            | null
            | undefined) === studentId,
      );

  const items = scopedInvoices.map(toBillingItem);
  const summary = buildBillingSummary(items);
  return { items, payments, summary };
}

function toScheduleItem(row: ScheduleBlock): StudentScheduleItem {
  const r = row as unknown as Record<string, unknown>;
  return {
    id: row.id,
    tenant_id: (r["tenant_id"] as string | undefined) ?? "",
    student_id: (r["student_id"] as string | null | undefined) ?? null,
    block_date: (r["block_date"] as string | null | undefined) ?? null,
    start_time: (r["start_time"] as string | null | undefined) ?? null,
    end_time: (r["end_time"] as string | null | undefined) ?? null,
    block_type: (r["block_type"] as string | null | undefined) ?? null,
    status: (r["status"] as string | null | undefined) ?? null,
    room: (r["room"] as string | null | undefined) ?? null,
    is_virtual: (r["is_virtual"] as boolean | null | undefined) ?? null,
    raw: row,
  };
}

function toLessonItem(row: SessionLog): StudentLessonItem {
  const r = row as unknown as Record<string, unknown>;
  const worked = r["worked_on"];
  const workedOn = Array.isArray(worked)
    ? worked.filter((w): w is string => typeof w === "string")
    : [];
  return {
    id: row.id,
    tenant_id: (r["tenant_id"] as string | undefined) ?? "",
    block_date: (r["block_date"] as string | null | undefined) ?? null,
    instrument: (r["instrument"] as string | null | undefined) ?? null,
    status: (r["status"] as string | null | undefined) ?? null,
    engagement_level:
      typeof r["engagement_level"] === "number"
        ? (r["engagement_level"] as number)
        : null,
    progress_indicator:
      (r["progress_indicator"] as string | null | undefined) ?? null,
    lesson_notes: (r["lesson_notes"] as string | null | undefined) ?? null,
    worked_on: workedOn,
    raw: row,
  };
}

function toMessageItem(row: AIConversation): StudentMessageItem {
  const r = row as unknown as Record<string, unknown>;
  const meta = (r["metadata"] as Record<string, unknown> | null | undefined) ?? {};
  const title =
    (meta?.["title"] as string | undefined) ??
    (meta?.["subject"] as string | undefined) ??
    (r["client_route"] as string | undefined) ??
    (r["source"] as string | undefined) ??
    "Conversation";
  const preview =
    (meta?.["preview"] as string | undefined) ??
    (meta?.["summary"] as string | undefined) ??
    null;
  return {
    id: row.id,
    tenant_id: (r["tenant_id"] as string | undefined) ?? "",
    title,
    preview,
    source: (r["source"] as string | null | undefined) ?? null,
    client_route: (r["client_route"] as string | null | undefined) ?? null,
    updated_at: (r["updated_at"] as string | null | undefined) ?? null,
    created_at: (r["created_at"] as string | null | undefined) ?? null,
    raw: row,
  };
}

function toBillingItem(row: SquareInvoice): StudentBillingItem {
  const r = row as unknown as Record<string, unknown>;
  const total =
    typeof r["amount_cents"] === "number"
      ? (r["amount_cents"] as number)
      : 0;
  const paid =
    typeof r["amount_paid"] === "number"
      ? (r["amount_paid"] as number)
      : typeof r["amount_paid_cents"] === "number"
        ? (r["amount_paid_cents"] as number)
        : 0;
  const balance = Math.max(0, total - paid);
  return {
    id: row.id,
    tenant_id: (r["tenant_id"] as string | undefined) ?? "",
    invoice_number: (r["invoice_number"] as string | null | undefined) ?? null,
    title: (r["title"] as string | null | undefined) ?? null,
    status: (r["status"] as string | null | undefined) ?? null,
    invoice_date: (r["invoice_date"] as string | null | undefined) ?? null,
    due_date: (r["due_date"] as string | null | undefined) ?? null,
    amount_cents: total,
    amount_paid_cents: paid,
    balance_cents: balance,
    raw: row,
  };
}

function buildBillingSummary(items: StudentBillingItem[]): StudentBillingSummary {
  const today = new Date().toISOString().slice(0, 10);
  let totalBilledCents = 0;
  let totalPaidCents = 0;
  let balanceCents = 0;
  let overdueCount = 0;
  let overdueAmountCents = 0;
  for (const it of items) {
    totalBilledCents += it.amount_cents;
    totalPaidCents += it.amount_paid_cents;
    balanceCents += it.balance_cents;
    const isUnpaid = it.balance_cents > 0;
    const isOverdue =
      isUnpaid && it.due_date != null && it.due_date < today;
    if (isOverdue) {
      overdueCount += 1;
      overdueAmountCents += it.balance_cents;
    }
  }
  return {
    totalBilledCents,
    totalPaidCents,
    balanceCents,
    overdueCount,
    overdueAmountCents,
    invoiceCount: items.length,
  };
}
