import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "payments";

export type PaymentRow = {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  invoice_id: string | null;
  family_id: string | null;
  student_id: string | null;
  amount_cents: number;
  currency: string;
  method: string;
  reference: string | null;
  paid_at: string;
  status: string;
  refunded_cents: number;
  refunded_at: string | null;
  refund_reason: string | null;
  recorded_by: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

export type PaymentInsert = Partial<
  Omit<PaymentRow, "id" | "tenant_id" | "created_at" | "updated_at">
> & {
  amount_cents: number;
};

export type PaymentUpdate = Partial<Omit<PaymentRow, "id" | "tenant_id" | "created_at">>;

export type PaymentFilter = {
  invoice_id?: string;
  family_id?: string;
  student_id?: string;
  status?: string;
  paid_after?: string;
  paid_before?: string;
};

export async function listPayments(
  tenantId: string,
  filter?: PaymentFilter,
  opts?: ListOptions,
): Promise<PaymentRow[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (filter?.invoice_id) query = query.eq("invoice_id", filter.invoice_id);
  if (filter?.family_id) query = query.eq("family_id", filter.family_id);
  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.paid_after) query = query.gte("paid_at", filter.paid_after);
  if (filter?.paid_before) query = query.lte("paid_at", filter.paid_before);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "paid_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as PaymentRow[];
}

export async function getPaymentById(
  id: string,
  tenantId: string,
): Promise<PaymentRow | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as PaymentRow | null;
}

export async function createPayment(
  tenantId: string,
  input: PaymentInsert,
): Promise<PaymentRow> {
  const supabase = await clientFor(tenantId);
  const payload = {
    currency: "USD",
    method: "manual",
    status: "succeeded",
    refunded_cents: 0,
    paid_at: new Date().toISOString(),
    ...input,
    tenant_id: tenantId,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as PaymentRow;
}

export async function updatePayment(
  id: string,
  tenantId: string,
  patch: PaymentUpdate,
): Promise<PaymentRow> {
  const supabase = await clientFor(tenantId);
  const body = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(TABLE)
    .update(body)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PaymentRow;
}

export async function deletePayment(id: string, tenantId: string): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
