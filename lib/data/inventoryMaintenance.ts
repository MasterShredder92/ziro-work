import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "inventory_maintenance";

export type InventoryMaintenanceKind =
  | "inspection"
  | "repair"
  | "cleaning"
  | "tuning"
  | "calibration"
  | "replacement_part"
  | "other";

export type InventoryMaintenanceStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type InventoryMaintenanceRow = {
  id: string;
  tenant_id: string;
  item_id: string;
  kind: InventoryMaintenanceKind;
  status: InventoryMaintenanceStatus;
  summary: string;
  notes: string | null;
  cost: number | null;
  vendor: string | null;
  performed_by: string | null;
  scheduled_for: string | null;
  performed_at: string | null;
  completed_at: string | null;
  next_due_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryMaintenanceFilter = {
  item_id?: string;
  status?: InventoryMaintenanceStatus;
  kind?: InventoryMaintenanceKind;
};

type GlobalStore = typeof globalThis & {
  __ziro_inventory_maintenance_store?: Map<string, InventoryMaintenanceRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, InventoryMaintenanceRow> {
  if (!g.__ziro_inventory_maintenance_store)
    g.__ziro_inventory_maintenance_store = new Map();
  return g.__ziro_inventory_maintenance_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `mnt_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(
  input: Partial<InventoryMaintenanceRow>,
): InventoryMaintenanceRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    item_id: String(input.item_id ?? ""),
    kind: (input.kind ?? "inspection") as InventoryMaintenanceKind,
    status: (input.status ?? "scheduled") as InventoryMaintenanceStatus,
    summary: String(input.summary ?? "Maintenance"),
    notes: input.notes ?? null,
    cost: input.cost ?? null,
    vendor: input.vendor ?? null,
    performed_by: input.performed_by ?? null,
    scheduled_for: input.scheduled_for ?? null,
    performed_at: input.performed_at ?? null,
    completed_at: input.completed_at ?? null,
    next_due_at: input.next_due_at ?? null,
    created_by: input.created_by ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export async function listInventoryMaintenance(
  filter: InventoryMaintenanceFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<InventoryMaintenanceRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.item_id) query = query.eq("item_id", filter.item_id);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.kind) query = query.eq("kind", filter.kind);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as InventoryMaintenanceRow[];
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
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .filter((r) => (filter.kind ? r.kind === filter.kind : true))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function upsertInventoryMaintenance(
  tenantId: string,
  input: Partial<InventoryMaintenanceRow> & {
    item_id: string;
    summary?: string;
  },
): Promise<InventoryMaintenanceRow> {
  const row = normalizeRow({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as InventoryMaintenanceRow;
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
