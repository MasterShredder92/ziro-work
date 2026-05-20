import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "plans";

export type PlanRow = {
  id: string;
  tenant_id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  limits: Record<string, unknown>;
  billing_plan_id: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PlanInsert = Partial<
  Omit<PlanRow, "id" | "tenant_id" | "created_at" | "updated_at">
> & {
  name: string;
};

export type PlanUpdate = Partial<Omit<PlanRow, "id" | "tenant_id" | "created_at">>;

export async function listPlans(
  tenantId: string,
  opts?: ListOptions & { activeOnly?: boolean },
): Promise<PlanRow[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (opts?.activeOnly) query = query.eq("is_active", true);
  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 100,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as PlanRow[];
}

export async function getPlanById(
  tenantId: string,
  planId: string,
): Promise<PlanRow | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", planId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as PlanRow | null;
}

export async function createPlan(tenantId: string, input: PlanInsert): Promise<PlanRow> {
  const supabase = await clientFor(tenantId);
  const payload = {
    price_monthly: 0,
    price_yearly: 0,
    limits: {},
    is_active: true,
    metadata: {},
    ...input,
    tenant_id: tenantId,
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();
  if (error) throw error;
  return data as PlanRow;
}

export async function updatePlan(
  tenantId: string,
  planId: string,
  patch: PlanUpdate,
): Promise<PlanRow> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", planId)
    .select("*")
    .single();
  if (error) throw error;
  return data as PlanRow;
}
