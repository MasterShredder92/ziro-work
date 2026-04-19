import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "inventory_stock";

export type InventoryStockRow = {
  id: string;
  tenant_id: string;
  item_id: string;
  location_id: string | null;
  room_id: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  shelf_label: string | null;
  notes: string | null;
  last_counted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryStockFilter = {
  item_id?: string;
  location_id?: string;
  room_id?: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_inventory_stock_store?: Map<string, InventoryStockRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, InventoryStockRow> {
  if (!g.__ziro_inventory_stock_store)
    g.__ziro_inventory_stock_store = new Map();
  return g.__ziro_inventory_stock_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `stock_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(input: Partial<InventoryStockRow>): InventoryStockRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    item_id: String(input.item_id ?? ""),
    location_id: input.location_id ?? null,
    room_id: input.room_id ?? null,
    quantity_on_hand:
      typeof input.quantity_on_hand === "number"
        ? Math.max(0, Math.floor(input.quantity_on_hand))
        : 0,
    quantity_reserved:
      typeof input.quantity_reserved === "number"
        ? Math.max(0, Math.floor(input.quantity_reserved))
        : 0,
    shelf_label: input.shelf_label ?? null,
    notes: input.notes ?? null,
    last_counted_at: input.last_counted_at ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export async function listInventoryStock(
  filter: InventoryStockFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<InventoryStockRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.item_id) query = query.eq("item_id", filter.item_id);
      if (filter.location_id) query = query.eq("location_id", filter.location_id);
      if (filter.room_id) query = query.eq("room_id", filter.room_id);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as InventoryStockRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  return Array.from(store().values())
    .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
    .filter((r) => (filter.item_id ? r.item_id === filter.item_id : true))
    .filter((r) => (filter.location_id ? r.location_id === filter.location_id : true))
    .filter((r) => (filter.room_id ? r.room_id === filter.room_id : true))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function upsertInventoryStock(
  tenantId: string,
  input: Partial<InventoryStockRow> & { item_id: string },
): Promise<InventoryStockRow> {
  const row = normalizeRow({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as InventoryStockRow;
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
