import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type { ChannelType } from "./messageThreads";
import type { MessageDeliveryStatus } from "./messageRecords";

const TABLE = "message_deliveries";

export type MessageDeliveryRow = {
  id: string;
  tenant_id: string;
  message_id: string;
  thread_id: string;
  recipient_id: string;
  channel_type: ChannelType;
  status: MessageDeliveryStatus;
  attempts: number;
  error_message: string | null;
  queued_at: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type DeliveryFilter = {
  message_id?: string;
  thread_id?: string;
  recipient_id?: string;
  channel_type?: ChannelType;
  status?: MessageDeliveryStatus;
};

type GlobalStore = typeof globalThis & {
  __ziro_message_deliveries_store?: Map<string, MessageDeliveryRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, MessageDeliveryRow> {
  if (!g.__ziro_message_deliveries_store)
    g.__ziro_message_deliveries_store = new Map();
  return g.__ziro_message_deliveries_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `dlv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(input: Partial<MessageDeliveryRow>): MessageDeliveryRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    message_id: String(input.message_id ?? ""),
    thread_id: String(input.thread_id ?? ""),
    recipient_id: String(input.recipient_id ?? ""),
    channel_type: (input.channel_type ?? "in_app") as ChannelType,
    status: (input.status ?? "queued") as MessageDeliveryStatus,
    attempts: Number(input.attempts ?? 0),
    error_message: input.error_message ?? null,
    queued_at: input.queued_at ?? now,
    sent_at: input.sent_at ?? null,
    delivered_at: input.delivered_at ?? null,
    read_at: input.read_at ?? null,
    failed_at: input.failed_at ?? null,
    metadata:
      input.metadata && typeof input.metadata === "object"
        ? input.metadata
        : null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listDeliveries(
  tenantId: string,
  filter?: DeliveryFilter,
  opts?: ListOptions,
): Promise<MessageDeliveryRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.message_id) query = query.eq("message_id", filter.message_id);
      if (filter?.thread_id) query = query.eq("thread_id", filter.thread_id);
      if (filter?.recipient_id)
        query = query.eq("recipient_id", filter.recipient_id);
      if (filter?.channel_type) query = query.eq("channel_type", filter.channel_type);
      if (filter?.status) query = query.eq("status", filter.status);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "queued_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as MessageDeliveryRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .filter((r) => (filter?.message_id ? r.message_id === filter.message_id : true))
    .filter((r) => (filter?.thread_id ? r.thread_id === filter.thread_id : true))
    .filter((r) =>
      filter?.recipient_id ? r.recipient_id === filter.recipient_id : true,
    )
    .filter((r) =>
      filter?.channel_type ? r.channel_type === filter.channel_type : true,
    )
    .filter((r) => (filter?.status ? r.status === filter.status : true))
    .sort((a, b) => b.queued_at.localeCompare(a.queued_at));
}

export async function upsertDelivery(
  tenantId: string,
  input: Partial<MessageDeliveryRow>,
): Promise<MessageDeliveryRow> {
  const row = normalize({ ...input, tenant_id: tenantId, updated_at: nowIso() });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as MessageDeliveryRow;
      if (error && isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else if (error) throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  store().set(row.id, row);
  return row;
}
