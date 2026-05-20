import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type { ChannelType } from "./messageThreads";

const TABLE = "messages";

export type MessageAttachment = {
  id: string;
  name: string;
  url: string;
  mime_type: string | null;
  size_bytes: number | null;
};

export type MessageDeliveryStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "bounced";

export type MessageRow = {
  id: string;
  tenant_id: string;
  thread_id: string;
  sender_id: string;
  recipient_ids: string[];
  channel_type: ChannelType;
  subject: string | null;
  body: string;
  body_html: string | null;
  template_id: string | null;
  merge_vars: Record<string, unknown> | null;
  attachments: MessageAttachment[];
  delivery_status: MessageDeliveryStatus;
  delivery_meta: Record<string, unknown> | null;
  reply_to_message_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageFilter = {
  thread_id?: string;
  sender_id?: string;
  recipient_id?: string;
  channel_type?: ChannelType;
  since?: string;
  until?: string;
  search?: string;
  delivery_status?: MessageDeliveryStatus;
};

type GlobalStore = typeof globalThis & {
  __ziro_messages_store?: Map<string, MessageRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, MessageRow> {
  if (!g.__ziro_messages_store) g.__ziro_messages_store = new Map();
  return g.__ziro_messages_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `msg_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(input: Partial<MessageRow>): MessageRow {
  const id = input.id ?? newId();
  const now = nowIso();
  const attachments = Array.isArray(input.attachments) ? input.attachments : [];
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    thread_id: String(input.thread_id ?? ""),
    sender_id: String(input.sender_id ?? ""),
    recipient_ids: Array.isArray(input.recipient_ids)
      ? input.recipient_ids.filter(
          (r): r is string => typeof r === "string" && r.length > 0,
        )
      : [],
    channel_type: (input.channel_type ?? "in_app") as ChannelType,
    subject: input.subject ?? null,
    body: String(input.body ?? ""),
    body_html: input.body_html ?? null,
    template_id: input.template_id ?? null,
    merge_vars:
      input.merge_vars && typeof input.merge_vars === "object"
        ? input.merge_vars
        : null,
    attachments,
    delivery_status: (input.delivery_status ?? "sent") as MessageDeliveryStatus,
    delivery_meta:
      input.delivery_meta && typeof input.delivery_meta === "object"
        ? input.delivery_meta
        : null,
    reply_to_message_id: input.reply_to_message_id ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listMessages(
  tenantId: string,
  filter?: MessageFilter,
  opts?: ListOptions,
): Promise<MessageRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.thread_id) query = query.eq("thread_id", filter.thread_id);
      if (filter?.sender_id) query = query.eq("sender_id", filter.sender_id);
      if (filter?.channel_type) query = query.eq("channel_type", filter.channel_type);
      if (filter?.delivery_status)
        query = query.eq("delivery_status", filter.delivery_status);
      if (filter?.recipient_id)
        query = query.contains("recipient_ids", [filter.recipient_id]);
      if (filter?.since) query = query.gte("created_at", filter.since);
      if (filter?.until) query = query.lte("created_at", filter.until);
      if (filter?.search && filter.search.trim()) {
        const q = filter.search.trim().replace(/[%_]/g, "\\$&");
        query = query.ilike("body", `%${q}%`);
      }
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "created_at",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as MessageRow[];
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
    .filter((r) => (filter?.thread_id ? r.thread_id === filter.thread_id : true))
    .filter((r) => (filter?.sender_id ? r.sender_id === filter.sender_id : true))
    .filter((r) =>
      filter?.channel_type ? r.channel_type === filter.channel_type : true,
    )
    .filter((r) =>
      filter?.delivery_status ? r.delivery_status === filter.delivery_status : true,
    )
    .filter((r) =>
      filter?.recipient_id ? r.recipient_ids.includes(filter.recipient_id) : true,
    )
    .filter((r) => (filter?.since ? r.created_at >= filter.since : true))
    .filter((r) => (filter?.until ? r.created_at <= filter.until : true))
    .filter((r) =>
      search
        ? r.body.toLowerCase().includes(search) ||
          (r.subject ?? "").toLowerCase().includes(search)
        : true,
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getMessage(
  messageId: string,
  tenantId?: string,
): Promise<MessageRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", messageId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as MessageRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const row = store().get(messageId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertMessage(
  tenantId: string,
  input: Partial<MessageRow>,
): Promise<MessageRow> {
  const row = normalize({ ...input, tenant_id: tenantId, updated_at: nowIso() });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as MessageRow;
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

export async function deleteMessage(
  messageId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("id", messageId)
        .eq("tenant_id", tenantId);
      if (!error) {
        store().delete(messageId);
        return;
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  store().delete(messageId);
}
