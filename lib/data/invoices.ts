import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "invoices";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "sent"
  | "partial"
  | "paid"
  | "overdue"
  | "void"
  | "refunded";

export type InvoiceRow = {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  number: string | null;
  status: InvoiceStatus | string;
  currency: string;
  family_id: string | null;
  student_id: string | null;
  subscription_id: string | null;
  billing_plan_id: string | null;
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  amount_cents: number;
  amount_paid_cents: number;
  balance_cents: number;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  sent_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  description: string | null;
  notes: string | null;
  terms: string | null;
  external_ref: string | null;
  archived_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type InvoiceInsert = Partial<
  Omit<InvoiceRow, "id" | "created_at" | "updated_at" | "tenant_id">
> & {
  status?: InvoiceStatus | string;
};

export type InvoiceUpdate = Partial<Omit<InvoiceRow, "id" | "tenant_id" | "created_at">>;

export type InvoiceFilter = {
  status?: string;
  statusIn?: string[];
  family_id?: string;
  student_id?: string;
  subscription_id?: string;
  due_before?: string;
  due_after?: string;
  q?: string;
};

export async function listInvoices(
  tenantId: string,
  filter?: InvoiceFilter,
  opts?: ListOptions,
): Promise<InvoiceRow[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.statusIn && filter.statusIn.length > 0)
    query = query.in("status", filter.statusIn);
  if (filter?.family_id) query = query.eq("family_id", filter.family_id);
  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.subscription_id)
    query = query.eq("subscription_id", filter.subscription_id);
  if (filter?.due_before) query = query.lte("due_at", filter.due_before);
  if (filter?.due_after) query = query.gte("due_at", filter.due_after);
  if (filter?.q) query = query.ilike("number", `%${filter.q}%`);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as InvoiceRow[];
}

export async function getInvoiceById(
  id: string,
  tenantId: string,
): Promise<InvoiceRow | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as InvoiceRow | null;
}

export async function createInvoice(
  tenantId: string,
  input: InvoiceInsert,
): Promise<InvoiceRow> {
  const supabase = await clientFor(tenantId);
  const payload = {
    status: "draft",
    currency: "USD",
    ...input,
    tenant_id: tenantId,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as InvoiceRow;
}

export async function updateInvoice(
  id: string,
  tenantId: string,
  patch: InvoiceUpdate,
): Promise<InvoiceRow> {
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
  return data as InvoiceRow;
}

export async function deleteInvoice(id: string, tenantId: string): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
