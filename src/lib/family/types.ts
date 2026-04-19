import type {
  AIConversation,
  Family,
  ScheduleBlock,
  SquareInvoice,
  SquarePayment,
  Student,
} from "@/lib/types/entities";

export interface FamilyStudentRow {
  id: string;
  tenant_id: string;
  family_id: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  initials: string;
  instrument: string | null;
  status: string | null;
  enrollment_type: string | null;
  teacher_name: string | null;
  raw: Student;
}

export interface FamilyScheduleItem {
  id: string;
  tenant_id: string;
  student_id: string | null;
  student_name: string | null;
  block_date: string | null;
  start_time: string | null;
  end_time: string | null;
  block_type: string | null;
  status: string | null;
  room: string | null;
  is_virtual: boolean | null;
  raw: ScheduleBlock;
}

export interface FamilyBillingItem {
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

export interface FamilyMessageItem {
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

export interface FamilyBillingSummary {
  totalBilledCents: number;
  totalPaidCents: number;
  balanceCents: number;
  overdueCount: number;
  overdueAmountCents: number;
  monthToDateRevenueCents: number;
  invoiceCount: number;
}

export interface FamilyDashboardData {
  family: Family | null;
  students: FamilyStudentRow[];
  schedule: FamilyScheduleItem[];
  billing: FamilyBillingItem[];
  billingSummary: FamilyBillingSummary;
  payments: SquarePayment[];
  messages: FamilyMessageItem[];
  generatedAt: string;
}

export interface FamilyDisplayProfile {
  id: string;
  familyName: string;
  email: string | null;
  phone: string | null;
  initials: string;
}

export function toFamilyDisplayProfile(
  family: Family | null,
): FamilyDisplayProfile | null {
  if (!family) return null;
  const name =
    (family.name as string | undefined) ??
    (family.primary_contact_name as string | undefined) ??
    (family.parent_name as string | undefined) ??
    "Family";
  const email = (family.primary_email as string | null | undefined) ?? null;
  const phone = (family.primary_phone as string | null | undefined) ?? null;
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return {
    id: family.id,
    familyName: name,
    email,
    phone,
    initials: initials || "F",
  };
}

export function studentDisplayName(s: Student): string {
  const row = s as unknown as Record<string, unknown>;
  const first = (row["first_name"] as string | undefined) ?? "";
  const last = (row["last_name"] as string | undefined) ?? "";
  const preferred = (row["preferred_name"] as string | undefined) ?? "";
  const display = `${first} ${last}`.trim();
  return display || preferred || s.id;
}

export function studentInitials(s: Student): string {
  const row = s as unknown as Record<string, unknown>;
  const first = (row["first_name"] as string | undefined) ?? "";
  const last = (row["last_name"] as string | undefined) ?? "";
  const initials = (first[0] ?? "") + (last[0] ?? "");
  return initials.toUpperCase() || "S";
}
