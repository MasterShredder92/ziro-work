import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "message_participants";

export type ParticipantRole = "owner" | "member" | "cc" | "bcc" | "observer";

export type MessageParticipantRow = {
  id: string;
  tenant_id: string;
  thread_id: string;
  profile_id: string;
  role: ParticipantRole;
  is_muted: boolean;
  last_read_at: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
};

export type ParticipantFilter = {
  thread_id?: string;
  profile_id?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_message_participants_store?: Map<string, MessageParticipantRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, MessageParticipantRow> {
  if (!g.__ziro_message_participants_store)
    g.__ziro_message_participants_store = new Map();
  return g.__ziro_message_participants_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `pcp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalize(
  input: Partial<MessageParticipantRow>,
): MessageParticipantRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    thread_id: String(input.thread_id ?? ""),
    profile_id: String(input.profile_id ?? ""),
    role: (input.role ?? "member") as ParticipantRole,
    is_muted: Boolean(input.is_muted ?? false),
    last_read_at: input.last_read_at ?? null,
    joined_at: input.joined_at ?? now,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listParticipants(
  tenantId: string,
  filter?: ParticipantFilter,
  opts?: ListOptions,
): Promise<MessageParticipantRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.thread_id) query = query.eq("thread_id", filter.thread_id);
      if (filter?.profile_id) query = query.eq("profile_id", filter.profile_id);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "joined_at",
        ascending: opts?.ascending ?? true,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as MessageParticipantRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .filter((r) => (filter?.thread_id ? r.thread_id === filter.thread_id : true))
    .filter((r) =>
      filter?.profile_id ? r.profile_id === filter.profile_id : true,
    )
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at));
}

export async function upsertParticipant(
  tenantId: string,
  input: Partial<MessageParticipantRow>,
): Promise<MessageParticipantRow> {
  const row = normalize({ ...input, tenant_id: tenantId, updated_at: nowIso() });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as MessageParticipantRow;
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

export async function removeParticipant(
  participantId: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("id", participantId)
        .eq("tenant_id", tenantId);
      if (!error) {
        store().delete(participantId);
        return;
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  store().delete(participantId);
}
