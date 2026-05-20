import { applyListOptions, clientFor, type ListOptions } from "./_client";

const TABLE = "usage_records";

export type UsageRecordRow = {
  id: string;
  tenant_id: string;
  metric: string;
  amount: number;
  timestamp: string;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type UsageRecordInsert = Partial<
  Omit<UsageRecordRow, "id" | "created_at">
> & {
  metric: string;
  amount: number;
};

export async function recordUsage(
  tenantId: string,
  input: UsageRecordInsert,
): Promise<UsageRecordRow> {
  const supabase = await clientFor(tenantId);
  const payload = {
    tenant_id: tenantId,
    timestamp: new Date().toISOString(),
    source: "system",
    metadata: {},
    ...input,
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();
  if (error) throw error;
  return data as UsageRecordRow;
}

export async function listUsageRecords(
  tenantId: string,
  filter?: { metric?: string; from?: string; to?: string },
  opts?: ListOptions,
): Promise<UsageRecordRow[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
  if (filter?.metric) query = query.eq("metric", filter.metric);
  if (filter?.from) query = query.gte("timestamp", filter.from);
  if (filter?.to) query = query.lte("timestamp", filter.to);
  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "timestamp",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 500,
    offset: opts?.offset,
  });
  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as UsageRecordRow[];
}
