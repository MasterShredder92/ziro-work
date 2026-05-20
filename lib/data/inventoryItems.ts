import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "inventory_items";

export type InventoryCondition = "new" | "good" | "fair" | "poor" | "retired";
export type InventoryStatus =
  | "available"
  | "in_use"
  | "maintenance"
  | "lost"
  | "retired";

export type InventoryCategory =
  | "instrument"
  | "accessory"
  | "sheet_music"
  | "electronics"
  | "furniture"
  | "consumable"
  | "other";

export type DepreciationMethod = "straight_line" | "declining" | "none";

export type InventoryItemRow = {
  id: string;
  tenant_id: string;
  location_id: string | null;
  name: string;
  sku: string | null;
  category: InventoryCategory;
  description: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  salvage_value: number | null;
  useful_life_months: number | null;
  depreciation_method: DepreciationMethod;
  condition: InventoryCondition;
  status: InventoryStatus;
  quantity: number;
  reorder_threshold: number | null;
  photo_url: string | null;
  notes: string | null;
  tags: string[];
  assigned_to: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryItemFilter = {
  category?: InventoryCategory;
  status?: InventoryStatus;
  location_id?: string;
  search?: string;
  includeArchived?: boolean;
};

type GlobalStore = typeof globalThis & {
  __ziro_inventory_items_store?: Map<string, InventoryItemRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, InventoryItemRow> {
  if (!g.__ziro_inventory_items_store)
    g.__ziro_inventory_items_store = new Map();
  return g.__ziro_inventory_items_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `inv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(input: Partial<InventoryItemRow>): InventoryItemRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    location_id: input.location_id ?? null,
    name: String(input.name ?? "Untitled item"),
    sku: input.sku ?? null,
    category: (input.category ?? "instrument") as InventoryCategory,
    description: input.description ?? null,
    brand: input.brand ?? null,
    model: input.model ?? null,
    serial_number: input.serial_number ?? null,
    purchase_date: input.purchase_date ?? null,
    purchase_price: input.purchase_price ?? null,
    current_value: input.current_value ?? null,
    salvage_value: input.salvage_value ?? null,
    useful_life_months: input.useful_life_months ?? null,
    depreciation_method: (input.depreciation_method ?? "straight_line") as DepreciationMethod,
    condition: (input.condition ?? "good") as InventoryCondition,
    status: (input.status ?? "available") as InventoryStatus,
    quantity:
      typeof input.quantity === "number" && Number.isFinite(input.quantity)
        ? Math.max(0, Math.floor(input.quantity))
        : 1,
    reorder_threshold: input.reorder_threshold ?? null,
    photo_url: input.photo_url ?? null,
    notes: input.notes ?? null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    assigned_to: input.assigned_to ?? null,
    archived_at: input.archived_at ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

function matchesFilter(row: InventoryItemRow, filter?: InventoryItemFilter) {
  if (!filter) return true;
  if (filter.category && row.category !== filter.category) return false;
  if (filter.status && row.status !== filter.status) return false;
  if (filter.location_id && row.location_id !== filter.location_id) return false;
  if (!filter.includeArchived && row.archived_at) return false;
  if (filter.search) {
    const t = filter.search.trim().toLowerCase();
    if (t.length > 0) {
      const hay = [
        row.name,
        row.sku,
        row.brand,
        row.model,
        row.serial_number,
        row.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(t)) return false;
    }
  }
  return true;
}

export async function listInventoryItems(
  tenantId: string,
  filter?: InventoryItemFilter,
  opts?: ListOptions,
): Promise<InventoryItemRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      if (filter?.category) query = query.eq("category", filter.category);
      if (filter?.status) query = query.eq("status", filter.status);
      if (filter?.location_id) query = query.eq("location_id", filter.location_id);
      if (!filter?.includeArchived) query = query.is("archived_at", null);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) {
        const rows = (data ?? []) as InventoryItemRow[];
        if (filter?.search) {
          return rows.filter((r) => matchesFilter(r, filter));
        }
        return rows;
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .filter((r) => matchesFilter(r, filter))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getInventoryItem(
  itemId: string,
  tenantId?: string,
): Promise<InventoryItemRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", itemId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as InventoryItemRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(itemId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertInventoryItem(
  tenantId: string,
  input: Partial<InventoryItemRow> & { name?: string },
): Promise<InventoryItemRow> {
  const row = normalizeRow({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as InventoryItemRow;
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
