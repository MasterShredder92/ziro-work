import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "inventory_checkouts";

export type InventoryCheckoutStatus =
  | "active"
  | "returned"
  | "overdue"
  | "lost"
  | "cancelled";

export type InventoryCheckoutRow = {
  id: string;
  tenant_id: string;
  item_id: string;
  profile_id: string;
  student_id: string | null;
  teacher_id: string | null;
  location_id: string | null;
  checked_out_at: string;
  due_date: string | null;
  returned_at: string | null;
  status: InventoryCheckoutStatus;
  quantity: number;
  condition_at_checkout: string | null;
  condition_at_return: string | null;
  notes: string | null;
  checked_out_by: string | null;
  returned_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryCheckoutFilter = {
  item_id?: string;
  profile_id?: string;
  student_id?: string;
  teacher_id?: string;
  status?: InventoryCheckoutStatus;
  activeOnly?: boolean;
};

type GlobalStore = typeof globalThis & {
  __ziro_inventory_checkouts_store?: Map<string, InventoryCheckoutRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, InventoryCheckoutRow> {
  if (!g.__ziro_inventory_checkouts_store)
    g.__ziro_inventory_checkouts_store = new Map();
  return g.__ziro_inventory_checkouts_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `chk_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeRow(
  input: Partial<InventoryCheckoutRow>,
): InventoryCheckoutRow {
  const now = nowIso();
  return {
    id: input.id ?? newId(),
    tenant_id: String(input.tenant_id ?? ""),
    item_id: String(input.item_id ?? ""),
    profile_id: String(input.profile_id ?? ""),
    student_id: input.student_id ?? null,
    teacher_id: input.teacher_id ?? null,
    location_id: input.location_id ?? null,
    checked_out_at: input.checked_out_at ?? now,
    due_date: input.due_date ?? null,
    returned_at: input.returned_at ?? null,
    status: (input.status ?? "active") as InventoryCheckoutStatus,
    quantity:
      typeof input.quantity === "number" && Number.isFinite(input.quantity)
        ? Math.max(1, Math.floor(input.quantity))
        : 1,
    condition_at_checkout: input.condition_at_checkout ?? null,
    condition_at_return: input.condition_at_return ?? null,
    notes: input.notes ?? null,
    checked_out_by: input.checked_out_by ?? null,
    returned_by: input.returned_by ?? null,
    created_at: input.created_at ?? now,
    updated_at: now,
  };
}

export async function listInventoryCheckouts(
  filter: InventoryCheckoutFilter,
  tenantId?: string,
  opts?: ListOptions,
): Promise<InventoryCheckoutRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*");
      if (tenantId) query = query.eq("tenant_id", tenantId);
      if (filter.item_id) query = query.eq("item_id", filter.item_id);
      if (filter.profile_id) query = query.eq("profile_id", filter.profile_id);
      if (filter.student_id) query = query.eq("student_id", filter.student_id);
      if (filter.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
      if (filter.status) query = query.eq("status", filter.status);
      if (filter.activeOnly) query = query.is("returned_at", null);

      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "checked_out_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 500,
        offset: opts?.offset,
      });

      const { data, error } = await ordered;
      if (!error) return (data ?? []) as InventoryCheckoutRow[];
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
    .filter((r) => (filter.profile_id ? r.profile_id === filter.profile_id : true))
    .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
    .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
    .filter((r) => (filter.status ? r.status === filter.status : true))
    .filter((r) => (filter.activeOnly ? r.returned_at == null : true))
    .sort((a, b) => b.checked_out_at.localeCompare(a.checked_out_at));
}

export async function getInventoryCheckout(
  checkoutId: string,
  tenantId?: string,
): Promise<InventoryCheckoutRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", checkoutId);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as InventoryCheckoutRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const row = store().get(checkoutId) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertInventoryCheckout(
  tenantId: string,
  input: Partial<InventoryCheckoutRow> & {
    item_id: string;
    profile_id: string;
  },
): Promise<InventoryCheckoutRow> {
  const row = normalizeRow({ ...input, tenant_id: tenantId });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as InventoryCheckoutRow;
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
