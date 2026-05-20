import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "billing_plans";

export type BillingPlanKind = "fixed" | "hourly" | "per_lesson" | "hybrid";
export type BillingPlanInterval = "week" | "month" | "quarter" | "year";

export type BillingPlanRow = {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  kind: BillingPlanKind | string;
  interval: BillingPlanInterval | string;
  interval_count: number;
  base_price_cents: number;
  per_unit_price_cents: number | null;
  included_units: number | null;
  unit_label: string | null;
  tax_rate_bp: number;
  currency: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, unknown> | null;
};

export type BillingPlanInsert = Partial<
  Omit<BillingPlanRow, "id" | "tenant_id" | "created_at" | "updated_at">
> & { name: string };

export type BillingPlanUpdate = Partial<
  Omit<BillingPlanRow, "id" | "tenant_id" | "created_at">
>;

export async function listBillingPlans(
  tenantId: string,
  opts?: ListOptions & { activeOnly?: boolean },
): Promise<BillingPlanRow[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (opts?.activeOnly) query = query.eq("active", true);
  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as BillingPlanRow[];
}

export async function getBillingPlanById(
  id: string,
  tenantId: string,
): Promise<BillingPlanRow | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as BillingPlanRow | null;
}

export async function createBillingPlan(
  tenantId: string,
  input: BillingPlanInsert,
): Promise<BillingPlanRow> {
  const supabase = await clientFor(tenantId);
  const payload = {
    kind: "fixed",
    interval: "month",
    interval_count: 1,
    currency: "USD",
    tax_rate_bp: 0,
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
  return data as BillingPlanRow;
}

export async function updateBillingPlan(
  id: string,
  tenantId: string,
  patch: BillingPlanUpdate,
): Promise<BillingPlanRow> {
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
  return data as BillingPlanRow;
}

export async function deleteBillingPlan(id: string, tenantId: string): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
