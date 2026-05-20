import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "invoice_line_items";

export type InvoiceLineItemRow = {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  invoice_id: string;
  student_id: string | null;
  session_log_id: string | null;
  schedule_block_id: string | null;
  kind: string;
  description: string;
  quantity: number;
  unit_amount_cents: number;
  amount_cents: number;
  taxable: boolean;
  sort_order: number;
  metadata: Record<string, unknown> | null;
};

export type InvoiceLineItemInsert = Partial<
  Omit<InvoiceLineItemRow, "id" | "tenant_id" | "created_at" | "updated_at">
> & {
  invoice_id: string;
  description: string;
};

export type InvoiceLineItemUpdate = Partial<
  Omit<InvoiceLineItemRow, "id" | "tenant_id" | "created_at">
>;

export async function listLineItems(
  tenantId: string,
  invoiceId: string,
  opts?: ListOptions,
): Promise<InvoiceLineItemRow[]> {
  const supabase = await clientFor(tenantId);
  const query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("invoice_id", invoiceId);
  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "sort_order",
    ascending: opts?.ascending ?? true,
    limit: opts?.limit ?? 500,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as InvoiceLineItemRow[];
}

export async function createLineItem(
  tenantId: string,
  input: InvoiceLineItemInsert,
): Promise<InvoiceLineItemRow> {
  const supabase = await clientFor(tenantId);
  const qty = input.quantity ?? 1;
  const unit = input.unit_amount_cents ?? 0;
  const amount = input.amount_cents ?? Math.round(qty * unit);
  const payload = {
    kind: "line",
    quantity: qty,
    unit_amount_cents: unit,
    amount_cents: amount,
    taxable: input.taxable ?? false,
    sort_order: input.sort_order ?? 0,
    ...input,
    tenant_id: tenantId,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as InvoiceLineItemRow;
}

export async function createLineItemsBulk(
  tenantId: string,
  items: InvoiceLineItemInsert[],
): Promise<InvoiceLineItemRow[]> {
  if (items.length === 0) return [];
  const supabase = await clientFor(tenantId);
  const rows = items.map((item) => {
    const qty = item.quantity ?? 1;
    const unit = item.unit_amount_cents ?? 0;
    const amount = item.amount_cents ?? Math.round(qty * unit);
    return {
      kind: "line",
      taxable: false,
      sort_order: 0,
      ...item,
      quantity: qty,
      unit_amount_cents: unit,
      amount_cents: amount,
      tenant_id: tenantId,
    };
  });
  const { data, error } = await supabase.from(TABLE).insert(rows).select("*");
  if (error) throw error;
  return (data ?? []) as InvoiceLineItemRow[];
}

export async function updateLineItem(
  id: string,
  tenantId: string,
  patch: InvoiceLineItemUpdate,
): Promise<InvoiceLineItemRow> {
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
  return data as InvoiceLineItemRow;
}

export async function deleteLineItem(id: string, tenantId: string): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLineItemsForInvoice(
  invoiceId: string,
  tenantId: string,
): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("invoice_id", invoiceId);
  if (error) throw error;
}
