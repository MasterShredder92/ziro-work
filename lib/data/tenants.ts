import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "tenants";

export type TenantRow = {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  timezone: string;
  locale: string;
  status: "active" | "suspended" | "archived";
  plan: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalWithStore = typeof globalThis & {
  __ziro_tenants_store?: Map<string, TenantRow>;
};

function store(): Map<string, TenantRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_tenants_store) g.__ziro_tenants_store = new Map();
  return g.__ziro_tenants_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `tnt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export type UpsertTenantInput = {
  id?: string;
  name?: string;
  slug?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  timezone?: string | null;
  locale?: string | null;
  status?: TenantRow["status"];
  plan?: string | null;
};

function merge(existing: TenantRow | undefined, input: UpsertTenantInput): TenantRow {
  const id = input.id ?? existing?.id ?? uuid();
  const now = nowIso();
  return {
    id,
    name: input.name ?? existing?.name ?? "Untitled tenant",
    slug: input.slug ?? existing?.slug ?? null,
    logo_url: input.logo_url ?? existing?.logo_url ?? null,
    primary_color: input.primary_color ?? existing?.primary_color ?? null,
    accent_color: input.accent_color ?? existing?.accent_color ?? null,
    timezone: input.timezone ?? existing?.timezone ?? "America/New_York",
    locale: input.locale ?? existing?.locale ?? "en-US",
    status: input.status ?? existing?.status ?? "active",
    plan: input.plan ?? existing?.plan ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
}

export async function getTenant(id: string): Promise<TenantRow | null> {
  if (tableMissing(TABLE)) return store().get(id) ?? null;
  try {
    const supabase = await clientFor(id);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as unknown as TenantRow | null;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return store().get(id) ?? null;
    }
    throw err;
  }
}

export async function listTenants(): Promise<TenantRow[]> {
  if (tableMissing(TABLE)) {
    return Array.from(store().values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }
  try {
    const supabase = await clientFor(null);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as TenantRow[];
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return listTenants();
    }
    throw err;
  }
}

export async function upsertTenant(input: UpsertTenantInput): Promise<TenantRow> {
  const existing = input.id ? await getTenant(input.id) : null;
  const next = merge(existing ?? undefined, input);
  if (tableMissing(TABLE)) {
    store().set(next.id, next);
    return next;
  }
  try {
    const supabase = await clientFor(next.id);
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(next, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as TenantRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(next.id, next);
      return next;
    }
    throw err;
  }
}
