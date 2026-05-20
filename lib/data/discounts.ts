import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "discounts";

export type DiscountRow = {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  code: string | null;
  name: string;
  kind: string;
  percent_bp: number | null;
  amount_cents: number | null;
  applies_to: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Record<string, unknown> | null;
};

export type DiscountInsert = Partial<
  Omit<DiscountRow, "id" | "tenant_id" | "created_at" | "updated_at">
> & { name: string };

export type DiscountUpdate = Partial<Omit<DiscountRow, "id" | "tenant_id" | "created_at">>;

export async function listDiscounts(
  tenantId: string,
  opts?: ListOptions,
): Promise<DiscountRow[]> {
  const supabase = await clientFor(tenantId);
  const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as DiscountRow[];
}

export async function createDiscount(
  tenantId: string,
  input: DiscountInsert,
): Promise<DiscountRow> {
  const supabase = await clientFor(tenantId);
  const payload = {
    kind: "percent",
    applies_to: "invoice",
    active: true,
    ...input,
    tenant_id: tenantId,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as DiscountRow;
}

export async function updateDiscount(
  id: string,
  tenantId: string,
  patch: DiscountUpdate,
): Promise<DiscountRow> {
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
  return data as DiscountRow;
}

export async function deleteDiscount(id: string, tenantId: string): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
