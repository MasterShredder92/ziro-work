import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type {
  CalendarFeed,
  CalendarFeedInsert,
  CalendarFeedUpdate,
} from "@/lib/schedule/types";

const TABLE = "calendar_feeds";

export type CalendarFeedFilter = {
  owner_type?: string;
  owner_id?: string;
  is_active?: boolean;
};

type Row = {
  id: string;
  tenant_id: string;
  owner_type: string;
  owner_id: string | null;
  token: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_calendar_feeds_store?: Map<string, Row>;
};
const g = globalThis as GlobalStore;
function store(): Map<string, Row> {
  if (!g.__ziro_calendar_feeds_store)
    g.__ziro_calendar_feeds_store = new Map();
  return g.__ziro_calendar_feeds_store;
}

function rowTo(r: Row): CalendarFeed {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    ownerType: r.owner_type as CalendarFeed["ownerType"],
    ownerId: r.owner_id,
    token: r.token,
    label: r.label,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(tenantId: string, input: CalendarFeedInsert): Row {
  const now = new Date().toISOString();
  return {
    id: input.id ?? `feed_${Math.random().toString(36).slice(2, 10)}`,
    tenant_id: tenantId,
    owner_type: input.ownerType,
    owner_id: input.ownerId,
    token: input.token,
    label: input.label,
    is_active: input.isActive,
    created_at: now,
    updated_at: now,
  };
}

export async function listCalendarFeeds(
  tenantId: string,
  filter?: CalendarFeedFilter,
  opts?: ListOptions,
): Promise<CalendarFeed[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.owner_type) q = q.eq("owner_type", filter.owner_type);
      if (filter?.owner_id) q = q.eq("owner_id", filter.owner_id);
      if (typeof filter?.is_active === "boolean")
        q = q.eq("is_active", filter.is_active);
      const ordered = applyListOptions(q, {
        orderBy: opts?.orderBy ?? "created_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return ((data as Row[]) ?? []).map(rowTo);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  return Array.from(store().values())
    .filter((r) => {
      if (r.tenant_id !== tenantId) return false;
      if (filter?.owner_type && r.owner_type !== filter.owner_type) return false;
      if (filter?.owner_id && r.owner_id !== filter.owner_id) return false;
      if (typeof filter?.is_active === "boolean" && r.is_active !== filter.is_active)
        return false;
      return true;
    })
    .map(rowTo);
}

export async function getCalendarFeed(
  id: string,
  tenantId: string,
): Promise<CalendarFeed | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
      if (!error) return data ? rowTo(data as Row) : null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = store().get(id);
  if (!r || r.tenant_id !== tenantId) return null;
  return rowTo(r);
}

export async function createCalendarFeed(
  tenantId: string,
  input: CalendarFeedInsert,
): Promise<CalendarFeed> {
  const row = toRow(tenantId, input);
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select("*")
        .single();
      if (!error) return rowTo(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  store().set(row.id, row);
  return rowTo(row);
}

export async function updateCalendarFeed(
  id: string,
  tenantId: string,
  patch: CalendarFeedUpdate,
): Promise<CalendarFeed> {
  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };
  if (patch.ownerType !== undefined) update.owner_type = patch.ownerType;
  if (patch.ownerId !== undefined) update.owner_id = patch.ownerId;
  if (patch.token !== undefined) update.token = patch.token;
  if (patch.label !== undefined) update.label = patch.label;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .update(update)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .single();
      if (!error) return rowTo(data as Row);
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (!existing || existing.tenant_id !== tenantId) {
    throw new Error(`calendar_feed ${id} not found`);
  }
  const next: Row = { ...existing, ...(update as Partial<Row>) };
  store().set(id, next);
  return rowTo(next);
}

export async function deleteCalendarFeed(
  id: string,
  tenantId: string,
): Promise<void> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
      if (!error) return;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const r = store().get(id);
  if (r && r.tenant_id === tenantId) store().delete(id);
}
