import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "subscriptions";

export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "past_due";

export type SubscriptionRow = {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  plan_id: string | null;
  billing_plan_id: string | null;
  family_id: string | null;
  student_id: string | null;
  status: SubscriptionStatus | string;
  start_date: string;
  end_date: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_invoice_at: string | null;
  cancel_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  price_override_cents: number | null;
  quantity: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

export type SubscriptionInsert = Partial<
  Omit<SubscriptionRow, "id" | "tenant_id" | "created_at" | "updated_at">
>;

export type SubscriptionUpdate = Partial<
  Omit<SubscriptionRow, "id" | "tenant_id" | "created_at">
>;

export type SubscriptionFilter = {
  family_id?: string;
  student_id?: string;
  billing_plan_id?: string;
  status?: string;
  due_before?: string;
};

export async function listSubscriptions(
  tenantId: string,
  filter?: SubscriptionFilter,
  opts?: ListOptions,
): Promise<SubscriptionRow[]> {
  const supabase = clientFor(tenantId);
  let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (filter?.family_id) query = query.eq("family_id", filter.family_id);
  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.billing_plan_id)
    query = query.eq("billing_plan_id", filter.billing_plan_id);
  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.due_before) query = query.lte("next_invoice_at", filter.due_before);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as SubscriptionRow[];
}

export async function getSubscriptionById(
  id: string,
  tenantId: string,
): Promise<SubscriptionRow | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as SubscriptionRow | null;
}

export async function createSubscription(
  tenantId: string,
  input: SubscriptionInsert,
): Promise<SubscriptionRow> {
  const supabase = clientFor(tenantId);
  const payload = {
    status: "active",
    quantity: 1,
    ...input,
    tenant_id: tenantId,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as SubscriptionRow;
}

export async function updateSubscription(
  id: string,
  tenantId: string,
  patch: SubscriptionUpdate,
): Promise<SubscriptionRow> {
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
  return data as SubscriptionRow;
}

export async function deleteSubscription(id: string, tenantId: string): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}
