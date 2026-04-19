import type {
  AIConversation,
  ScheduleBlock,
  SessionLog,
  SquareInvoice,
  SquarePayment,
  Student,
} from "@/lib/types/entities";

export interface StudentScheduleItem {
  id: string;
  tenant_id: string;
  student_id: string | null;
  block_date: string | null;
  start_time: string | null;
  end_time: string | null;
  block_type: string | null;
  status: string | null;
  room: string | null;
  is_virtual: boolean | null;
  raw: ScheduleBlock;
}

export interface StudentLessonItem {
  id: string;
  tenant_id: string;
  block_date: string | null;
  instrument: string | null;
  status: string | null;
  engagement_level: number | null;
  progress_indicator: string | null;
  lesson_notes: string | null;
  worked_on: string[];
  raw: SessionLog;
}

export interface StudentMessageItem {
  id: string;
  tenant_id: string;
  title: string;
  preview: string | null;
  source: string | null;
  client_route: string | null;
  updated_at: string | null;
  created_at: string | null;
  raw: AIConversation;
}

export interface StudentBillingItem {
  id: string;
  tenant_id: string;
  invoice_number: string | null;
  title: string | null;
  status: string | null;
  invoice_date: string | null;
  due_date: string | null;
  amount_cents: number;
  amount_paid_cents: number;
  balance_cents: number;
  raw: SquareInvoice;
}

export interface StudentBillingSummary {
  totalBilledCents: number;
  totalPaidCents: number;
  balanceCents: number;
  overdueCount: number;
  overdueAmountCents: number;
  invoiceCount: number;
}

export interface StudentDashboardData {
  student: Student | null;
  schedule: StudentScheduleItem[];
  lessons: StudentLessonItem[];
  messages: StudentMessageItem[];
  billing: StudentBillingItem[];
  billingSummary: StudentBillingSummary;
  payments: SquarePayment[];
  generatedAt: string;
}

export interface StudentDisplayProfile {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  initials: string;
  instrument: string | null;
  teacherName: string | null;
}

export function toStudentDisplayProfile(
  student: Student | null,
): StudentDisplayProfile | null {
  if (!student) return null;
  const row = student as unknown as Record<string, unknown>;
  const first = (row["first_name"] as string | undefined) ?? "";
  const last = (row["last_name"] as string | undefined) ?? "";
  const preferred = (row["preferred_name"] as string | undefined) ?? "";
  const email = (row["email"] as string | null | undefined) ?? null;
  const instrument = (row["instrument"] as string | null | undefined) ?? null;
  const teacherName =
    (row["first_teacher_name"] as string | null | undefined) ??
    (row["last_teacher_name"] as string | null | undefined) ??
    null;
  const fullName =
    `${first} ${last}`.trim() || preferred || email || student.id;
  const initials =
    ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() ||
    (preferred[0] ?? "S").toUpperCase();
  return {
    id: student.id,
    fullName,
    firstName: first || preferred || fullName,
    lastName: last,
    email,
    initials: initials.slice(0, 2),
    instrument,
    teacherName,
  };
}
