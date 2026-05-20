/**
 * Billing OS integration for CRM entities.
 * Surfaces family billing relationships without mutating billing rows.
 */
import { clientFor } from "@data/_client";
import type { Family } from "@/lib/types/crm";
import type { Student } from "@/lib/types/entities";

export type FamilyBillingSummary = {
  familyId: string;
  billingStatus: string;
  balanceCents: number;
  overdueCents: number;
  autopayEnabled: boolean;
  lifetimePaidCents: number;
};

export async function getFamilyBillingSummary(
  tenantId: string,
  familyId: string,
): Promise<FamilyBillingSummary | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from("families")
    .select(
      "id, billing_status, balance, overdue_balance_cents, autopay_enabled, lifetime_paid_cents",
    )
    .eq("tenant_id", tenantId)
    .eq("id", familyId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Pick<
    Family,
    | "id"
    | "billing_status"
    | "balance"
    | "overdue_balance_cents"
    | "autopay_enabled"
    | "lifetime_paid_cents"
  >;
  return {
    familyId: row.id,
    billingStatus: row.billing_status,
    balanceCents: Math.round((row.balance ?? 0) * 100),
    overdueCents: row.overdue_balance_cents ?? 0,
    autopayEnabled: Boolean(row.autopay_enabled),
    lifetimePaidCents: row.lifetime_paid_cents ?? 0,
  };
}

export type FamilyStudentRow = {
  id: string;
  name: string;
  status: string | null;
  instrument: string | null;
  location_id: string | null;
  rate_per_session: number | null;
  total_paid: number | null;
  teacher_label: string | null;
};

export async function listStudentsForFamily(
  tenantId: string,
  familyId: string,
): Promise<FamilyStudentRow[]> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from("students")
    .select(
      "id, first_name, last_name, status, instrument, location_id, rate_per_session, total_paid, first_teacher_name, last_teacher_name",
    )
    .eq("tenant_id", tenantId)
    .eq("family_id", familyId);
  if (error) throw error;
  return (data ?? []).map((raw) => {
    const r = raw as Student;
    return {
      id: r.id,
      name:
        `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Unnamed",
      status: r.status ?? null,
      instrument: r.instrument ?? null,
      location_id: r.location_id ?? null,
      rate_per_session:
        typeof r.rate_per_session === "number" ? r.rate_per_session : null,
      total_paid: typeof r.total_paid === "number" ? r.total_paid : null,
      teacher_label: r.last_teacher_name ?? r.first_teacher_name ?? null,
    };
  });
}
