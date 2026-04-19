import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "credits";

export type CreditRow = {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  family_id: string | null;
  student_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  amount_cents: number;
  applied_cents: number;
  reason: string | null;
  expires_at: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
};

export type CreditInsert = Partial<
  Omit<CreditRow, "id" | "tenant_id" | "created_at" | "updated_at">
> & { amount_cents: number };

export type CreditUpdate = Partial<Omit<CreditRow, "id" | "tenant_id" | "created_at">>;

export type CreditFilter = {
  family_id?: string;
  student_id?: string;
  status?: string;
};

export async function listCredits(
  tenantId: string,
  filter?: CreditFilter,
  opts?: ListOptions,
): Promise<CreditRow[]> {
  const supabase = clientFor(tenantId);
  let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (filter?.family_id) query = query.eq("family_id", filter.family_id);
  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.status) query = query.eq("status", filter.status);
  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as CreditRow[];
}

export async function createCredit(
  tenantId: string,
  input: CreditInsert,
): Promise<CreditRow> {
  const supabase = clientFor(tenantId);
  const payload = {
    status: "active",
    applied_cents: 0,
    ...input,
    tenant_id: tenantId,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as CreditRow;
}

export async function updateCredit(
  id: string,
  tenantId: string,
  patch: CreditUpdate,
): Promise<CreditRow> {
  const supabase = clientFor(tenantId);
  const body = { ...patch, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(TABLE)
    .update(body)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as CreditRow;
}

export async function deleteCredit(id: string, tenantId: string): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
