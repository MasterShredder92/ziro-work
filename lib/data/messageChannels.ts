import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type { ChannelType } from "./messageThreads";

const TABLE = "message_channels";

export type MessageChannelRow = {
  id: string;
  tenant_id: string;
  channel_type: ChannelType;
  label: string;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ChannelFilter = {
  channel_type?: ChannelType;
  is_active?: boolean;
};

type GlobalStore = typeof globalThis & {
  __ziro_message_channels_store?: Map<string, MessageChannelRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, MessageChannelRow> {
  if (!g.__ziro_message_channels_store)
    g.__ziro_message_channels_store = new Map();
  return g.__ziro_message_channels_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `chn_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(input: Partial<MessageChannelRow>): MessageChannelRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    channel_type: (input.channel_type ?? "in_app") as ChannelType,
    label: String(input.label ?? "In-app"),
    is_active: input.is_active ?? true,
    is_default: input.is_default ?? false,
    config:
      input.config && typeof input.config === "object" ? input.config : null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

const DEFAULT_CHANNELS: Array<{ channel_type: ChannelType; label: string; is_default: boolean }> = [
  { channel_type: "in_app", label: "In-app", is_default: true },
  { channel_type: "email", label: "Email", is_default: false },
  { channel_type: "sms", label: "SMS", is_default: false },
  { channel_type: "push", label: "Push", is_default: false },
];

function seedDefaults(tenantId: string): MessageChannelRow[] {
  const existing = Array.from(store().values()).filter(
    (r) => r.tenant_id === tenantId,
  );
  if (existing.length > 0) return existing;
  const seeded: MessageChannelRow[] = DEFAULT_CHANNELS.map((c) =>
    normalize({ tenant_id: tenantId, channel_type: c.channel_type, label: c.label, is_default: c.is_default }),
  );
  for (const row of seeded) store().set(row.id, row);
  return seeded;
}

export async function listChannels(
  tenantId: string,
  filter?: ChannelFilter,
  opts?: ListOptions,
): Promise<MessageChannelRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.channel_type) query = query.eq("channel_type", filter.channel_type);
      if (typeof filter?.is_active === "boolean")
        query = query.eq("is_active", filter.is_active);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "channel_type",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 100,
      });
      const { data, error } = await ordered;
      if (!error) {
        const rows = (data ?? []) as MessageChannelRow[];
        return rows.length > 0 ? rows : seedDefaults(tenantId);
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const seeded = seedDefaults(tenantId);
  return seeded
    .filter((r) =>
      filter?.channel_type ? r.channel_type === filter.channel_type : true,
    )
    .filter((r) =>
      typeof filter?.is_active === "boolean"
        ? r.is_active === filter.is_active
        : true,
    );
}

export async function upsertChannel(
  tenantId: string,
  input: Partial<MessageChannelRow>,
): Promise<MessageChannelRow> {
  const row = normalize({ ...input, tenant_id: tenantId, updated_at: nowIso() });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as MessageChannelRow;
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
