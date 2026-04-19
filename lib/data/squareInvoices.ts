import type { SquareInvoice, SquarePayment, SquareRefund } from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const INVOICES = "square_invoices";
const PAYMENTS = "square_payments_fact";
const REFUNDS = "square_refunds_fact";

export type SquareInvoiceFilter = {
  status?: string;
  customer_id?: string;
  invoice_date_from?: string;
  invoice_date_to?: string;
};

export async function listSquareInvoices(
  tenantId: string,
  filter?: SquareInvoiceFilter,
  opts?: ListOptions,
): Promise<SquareInvoice[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(INVOICES)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.customer_id) query = query.eq("customer_id", filter.customer_id);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 100,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as SquareInvoice[];
}

export async function listSquarePayments(
  tenantId: string,
  opts?: ListOptions,
): Promise<SquarePayment[]> {
  const supabase = clientFor(tenantId);
  const query = supabase
    .from(PAYMENTS)
    .select("*")
    .eq("tenant_id", tenantId);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "reporting_date",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as SquarePayment[];
}

export async function listSquareRefunds(
  tenantId: string,
  opts?: ListOptions,
): Promise<SquareRefund[]> {
  const supabase = clientFor(tenantId);
  const query = supabase
    .from(REFUNDS)
    .select("*")
    .eq("tenant_id", tenantId);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 100,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as SquareRefund[];
}
