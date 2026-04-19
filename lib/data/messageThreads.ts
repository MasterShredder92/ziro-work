import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "message_threads";

export type ChannelType = "email" | "sms" | "in_app" | "push";
export type ThreadStatus = "open" | "archived" | "snoozed";

export type MessageThreadRow = {
  id: string;
  tenant_id: string;
  subject: string | null;
  channel_type: ChannelType;
  status: ThreadStatus;
  participant_ids: string[];
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_by: Record<string, number> | null;
  read_by: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
  context_type: string | null;
  context_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageThreadFilter = {
  status?: ThreadStatus;
  channel_type?: ChannelType;
  participant_id?: string;
  context_type?: string;
  context_id?: string;
  search?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_message_threads_store?: Map<string, MessageThreadRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, MessageThreadRow> {
  if (!g.__ziro_message_threads_store) g.__ziro_message_threads_store = new Map();
  return g.__ziro_message_threads_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `thr_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(input: Partial<MessageThreadRow>): MessageThreadRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    subject: input.subject ?? null,
    channel_type: (input.channel_type ?? "in_app") as ChannelType,
    status: (input.status ?? "open") as ThreadStatus,
    participant_ids: Array.isArray(input.participant_ids)
      ? input.participant_ids.filter(
          (p): p is string => typeof p === "string" && p.length > 0,
        )
      : [],
    last_message_preview: input.last_message_preview ?? null,
    last_message_at: input.last_message_at ?? null,
    unread_by:
      input.unread_by && typeof input.unread_by === "object"
        ? input.unread_by
        : null,
    read_by:
      input.read_by && typeof input.read_by === "object" ? input.read_by : null,
    metadata:
      input.metadata && typeof input.metadata === "object"
        ? input.metadata
        : null,
    context_type: input.context_type ?? null,
    context_id: input.context_id ?? null,
    created_by: input.created_by ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listThreads(
  tenantId: string,
  filter?: MessageThreadFilter,
  opts?: ListOptions,
): Promise<MessageThreadRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.channel_type) query = query.eq("channel_type", filter.channel_type);
      if (filter?.context_type) query = query.eq("context_type", filter.context_type);
      if (filter?.context_id) query = query.eq("context_id", filter.context_id);
      if (filter?.participant_id) {
        query = query.contains("participant_ids", [filter.participant_id]);
      }
      if (filter?.search && filter.search.trim().length > 0) {
        const q = filter.search.trim().replace(/[%_]/g, "\\$&");
        query = query.ilike("subject", `%${q}%`);
      }
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "last_message_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as MessageThreadRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const search = filter?.search?.toLowerCase() ?? "";
  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .filter((r) => (filter?.status ? r.status === filter.status : true))
    .filter((r) =>
      filter?.channel_type ? r.channel_type === filter.channel_type : true,
    )
    .filter((r) =>
      filter?.context_type ? r.context_type === filter.context_type : true,
    )
    .filter((r) =>
      filter?.context_id ? r.context_id === filter.context_id : true,
    )
    .filter((r) =>
      filter?.participant_id
        ? r.participant_ids.includes(filter.participant_id)
        : true,
    )
    .filter((r) =>
      search
        ? (r.subject ?? "").toLowerCase().includes(search) ||
          (r.last_message_preview ?? "").toLowerCase().includes(search)
        : true,
    )
    .sort(
      (a, b) =>
        new Date(b.last_message_at ?? b.updated_at).getTime() -
        new Date(a.last_message_at ?? a.updated_at).getTime(),
    );
}

export async function getThread(
  threadId: string,
  tenantId?: string,
): Promise<MessageThreadRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", threadId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as MessageThreadRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const row = store().get(threadId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertThread(
  tenantId: string,
  input: Partial<MessageThreadRow>,
): Promise<MessageThreadRow> {
  const row = normalize({ ...input, tenant_id: tenantId, updated_at: nowIso() });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as MessageThreadRow;
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

export async function deleteThread(
  threadId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("id", threadId)
        .eq("tenant_id", tenantId);
      if (!error) {
        store().delete(threadId);
        return;
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  store().delete(threadId);
}
