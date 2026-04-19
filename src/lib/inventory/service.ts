import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  closeCheckout,
  createCheckout,
  createMaintenanceRecord,
  getCheckout,
  getInventoryItem,
  listCheckouts,
  listInventoryItems,
  listMaintenance,
  listStock,
  updateInventoryItem,
} from "./queries";
import type {
  CheckoutInput,
  DepreciationPoint,
  DepreciationRecord,
  InventoryCategory,
  InventoryCheckout,
  InventoryDashboardData,
  InventoryItem,
  InventoryItemSummary,
  InventoryItemSurface,
  InventoryKpis,
  InventoryMaintenance,
  InventoryStock,
  MaintenanceInput,
} from "./types";

const DEPRECIATION_STEPS = 12;
const LOW_STOCK_FALLBACK = 1;

function nowIso(): string {
  return new Date().toISOString();
}

function monthsBetween(from: string | null, to: Date): number {
  if (!from) return 0;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return 0;
  const months =
    (to.getFullYear() - start.getFullYear()) * 12 +
    (to.getMonth() - start.getMonth());
  return Math.max(0, months);
}

export function computeDepreciation(item: InventoryItem): DepreciationRecord {
  const purchasePrice = Number(item.purchase_price ?? 0);
  const salvageValue = Number(item.salvage_value ?? 0);
  const usefulLifeMonths = Math.max(
    1,
    Number(item.useful_life_months ?? 0) || 0,
  );
  const method = item.depreciation_method ?? "straight_line";
  const now = new Date();
  const monthsElapsed = monthsBetween(item.purchase_date, now);
  const depreciable = Math.max(0, purchasePrice - salvageValue);

  const curve: DepreciationPoint[] = [];
  const purchaseStart = item.purchase_date
    ? new Date(item.purchase_date)
    : now;

  const totalMonths = Math.max(usefulLifeMonths, DEPRECIATION_STEPS);
  const step = Math.max(1, Math.floor(totalMonths / DEPRECIATION_STEPS));

  const valueAt = (m: number): number => {
    if (method === "none") return purchasePrice;
    if (purchasePrice <= 0) return 0;
    if (method === "declining") {
      const ratio = Math.max(
        0,
        1 - Math.min(1, m / Math.max(1, usefulLifeMonths)),
      );
      const declined = depreciable * Math.pow(ratio, 1.4) + salvageValue;
      return Math.max(salvageValue, Math.min(purchasePrice, declined));
    }
    const frac = Math.min(1, m / usefulLifeMonths);
    return Math.max(salvageValue, purchasePrice - depreciable * frac);
  };

  for (let i = 0; i <= DEPRECIATION_STEPS; i += 1) {
    const m = i * step;
    const date = new Date(purchaseStart);
    date.setMonth(date.getMonth() + m);
    curve.push({
      month: m,
      date: date.toISOString().slice(0, 10),
      value: roundTo(valueAt(m), 2),
    });
  }

  const currentValue =
    typeof item.current_value === "number"
      ? Number(item.current_value)
      : valueAt(monthsElapsed);
  const accumulated = Math.max(0, purchasePrice - currentValue);
  const percentRemaining =
    purchasePrice > 0
      ? Math.max(0, Math.min(100, (currentValue / purchasePrice) * 100))
      : 0;

  return {
    itemId: item.id,
    method,
    purchasePrice,
    salvageValue,
    usefulLifeMonths,
    monthsElapsed,
    currentValue: roundTo(currentValue, 2),
    accumulated: roundTo(accumulated, 2),
    percentRemaining: roundTo(percentRemaining, 1),
    curve,
  };
}

function roundTo(value: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function isOverdue(checkout: InventoryCheckout, now: Date): boolean {
  if (checkout.returned_at) return false;
  if (checkout.status === "overdue") return true;
  if (!checkout.due_date) return false;
  const due = new Date(checkout.due_date);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < now.getTime();
}

function sumStock(stock: InventoryStock[]): {
  onHand: number;
  reserved: number;
} {
  return stock.reduce(
    (acc, s) => ({
      onHand: acc.onHand + (s.quantity_on_hand ?? 0),
      reserved: acc.reserved + (s.quantity_reserved ?? 0),
    }),
    { onHand: 0, reserved: 0 },
  );
}

function summarizeItem(
  item: InventoryItem,
  checkouts: InventoryCheckout[],
  stock: InventoryStock[],
  maintenance: InventoryMaintenance[],
  now: Date,
): InventoryItemSummary {
  const active = checkouts.filter((c) => !c.returned_at);
  const overdue = active.filter((c) => isOverdue(c, now));
  const { onHand } = sumStock(stock);
  const open = maintenance.filter(
    (m) => m.status === "scheduled" || m.status === "in_progress",
  );
  const lastCompleted = maintenance
    .filter((m) => m.status === "completed")
    .map((m) => m.completed_at ?? m.updated_at)
    .sort((a, b) => (b ?? "").localeCompare(a ?? ""))[0];

  return {
    item,
    activeCheckouts: active.length,
    overdueCheckouts: overdue.length,
    totalOnHand: onHand || item.quantity,
    openMaintenance: open.length,
    lastMaintenanceAt: lastCompleted ?? null,
  };
}

export async function getInventoryDashboard(
  tenantId: string,
): Promise<InventoryDashboardData> {
  await assertTenantAccess(tenantId);

  const items = await listInventoryItems(tenantId);
  const now = new Date();

  const checkoutsByItem = new Map<string, InventoryCheckout[]>();
  const stockByItem = new Map<string, InventoryStock[]>();
  const maintenanceByItem = new Map<string, InventoryMaintenance[]>();

  await Promise.all(
    items.map(async (item) => {
      const [checkouts, stock, maintenance] = await Promise.all([
        listCheckouts(item.id, tenantId),
        listStock(item.id, tenantId),
        listMaintenance(item.id, tenantId),
      ]);
      checkoutsByItem.set(item.id, checkouts);
      stockByItem.set(item.id, stock);
      maintenanceByItem.set(item.id, maintenance);
    }),
  );

  const summaries: InventoryItemSummary[] = items.map((item) =>
    summarizeItem(
      item,
      checkoutsByItem.get(item.id) ?? [],
      stockByItem.get(item.id) ?? [],
      maintenanceByItem.get(item.id) ?? [],
      now,
    ),
  );

  const allCheckouts = Array.from(checkoutsByItem.values()).flat();
  const allMaintenance = Array.from(maintenanceByItem.values()).flat();
  const overdue = allCheckouts.filter((c) => isOverdue(c, now));
  const maintenanceDue = allMaintenance.filter((m) => {
    if (m.status === "scheduled" || m.status === "in_progress") return true;
    if (m.next_due_at) {
      const due = new Date(m.next_due_at);
      if (!Number.isNaN(due.getTime()) && due.getTime() <= now.getTime())
        return true;
    }
    return false;
  });

  const byCategoryMap = new Map<InventoryCategory, number>();
  let totalPurchaseValue = 0;
  let totalCurrentValue = 0;
  let lowStockItems = 0;

  for (const item of items) {
    byCategoryMap.set(
      item.category,
      (byCategoryMap.get(item.category) ?? 0) + 1,
    );
    totalPurchaseValue += Number(item.purchase_price ?? 0);
    const dep = computeDepreciation(item);
    totalCurrentValue += dep.currentValue;
    const stockList = stockByItem.get(item.id) ?? [];
    const { onHand } = sumStock(stockList);
    const effective = onHand || item.quantity;
    const threshold =
      typeof item.reorder_threshold === "number"
        ? item.reorder_threshold
        : LOW_STOCK_FALLBACK;
    if (effective <= threshold && item.category === "consumable") {
      lowStockItems += 1;
    }
  }

  const totalQuantity = items.reduce((acc, i) => acc + (i.quantity ?? 0), 0);

  const kpis: InventoryKpis = {
    totalItems: items.length,
    totalQuantity,
    itemsAvailable: items.filter((i) => i.status === "available").length,
    itemsInUse: items.filter((i) => i.status === "in_use").length,
    itemsMaintenance: items.filter((i) => i.status === "maintenance").length,
    itemsRetired: items.filter((i) => i.status === "retired").length,
    activeCheckouts: allCheckouts.filter((c) => !c.returned_at).length,
    overdueCheckouts: overdue.length,
    maintenanceDue: maintenanceDue.length,
    maintenanceInProgress: allMaintenance.filter(
      (m) => m.status === "in_progress",
    ).length,
    lowStockItems,
    totalPurchaseValue: roundTo(totalPurchaseValue, 2),
    totalCurrentValue: roundTo(totalCurrentValue, 2),
    depreciationToDate: roundTo(totalPurchaseValue - totalCurrentValue, 2),
    byCategory: Array.from(byCategoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  };

  return {
    tenantId,
    generatedAt: nowIso(),
    items: summaries,
    kpis,
    overdue,
    maintenanceDue,
  };
}

export async function getInventoryItemSurface(
  itemId: string,
  tenantId: string,
): Promise<InventoryItemSurface | null> {
  await assertTenantAccess(tenantId);

  const item = await getInventoryItem(itemId, tenantId);
  if (!item) return null;

  const [stock, checkouts, maintenance] = await Promise.all([
    listStock(itemId, tenantId),
    listCheckouts(itemId, tenantId),
    listMaintenance(itemId, tenantId),
  ]);

  const now = new Date();
  const active = checkouts.filter((c) => !c.returned_at);
  const { onHand, reserved } = sumStock(stock);
  const open = maintenance.filter(
    (m) => m.status === "scheduled" || m.status === "in_progress",
  );

  return {
    tenantId,
    item,
    stock,
    checkouts,
    maintenance,
    depreciation: computeDepreciation(item),
    kpis: {
      totalOnHand: onHand || item.quantity,
      totalReserved: reserved,
      activeCheckouts: active.length,
      overdueCheckouts: active.filter((c) => isOverdue(c, now)).length,
      openMaintenance: open.length,
    },
    generatedAt: nowIso(),
  };
}

export async function checkoutItem(
  input: CheckoutInput,
): Promise<InventoryItemSurface> {
  await assertTenantAccess(input.tenantId);

  const item = await getInventoryItem(input.itemId, input.tenantId);
  if (!item) throw new Error("INVENTORY_ITEM_NOT_FOUND");

  await createCheckout(input.tenantId, {
    item_id: input.itemId,
    profile_id: input.profileId,
    student_id: input.studentId ?? null,
    teacher_id: input.teacherId ?? null,
    location_id: input.locationId ?? item.location_id ?? null,
    due_date: input.dueDate ?? null,
    quantity: input.quantity ?? 1,
    condition_at_checkout: input.conditionAtCheckout ?? item.condition,
    notes: input.notes ?? null,
    checked_out_by: input.checkedOutBy ?? input.profileId,
    status: "active",
  });

  if (item.status === "available") {
    await updateInventoryItem(input.tenantId, input.itemId, {
      status: "in_use",
      assigned_to: input.profileId,
    });
  }

  const surface = await getInventoryItemSurface(input.itemId, input.tenantId);
  if (!surface) throw new Error("INVENTORY_ITEM_NOT_FOUND");
  return surface;
}

export async function returnItem(
  checkoutId: string,
  tenantId: string,
  patch?: {
    conditionAtReturn?: string | null;
    notes?: string | null;
    returnedBy?: string | null;
  },
): Promise<InventoryItemSurface> {
  await assertTenantAccess(tenantId);

  const existing = await getCheckout(checkoutId, tenantId);
  if (!existing) throw new Error("INVENTORY_CHECKOUT_NOT_FOUND");

  const closed = await closeCheckout(tenantId, checkoutId, {
    status: "returned",
    condition_at_return: patch?.conditionAtReturn ?? null,
    notes: patch?.notes ?? existing.notes,
    returned_by: patch?.returnedBy ?? null,
  });
  if (!closed) throw new Error("INVENTORY_CHECKOUT_NOT_FOUND");

  const remaining = await listCheckouts(closed.item_id, tenantId, {
    activeOnly: true,
  });
  if (remaining.length === 0) {
    const item = await getInventoryItem(closed.item_id, tenantId);
    if (item && item.status === "in_use") {
      await updateInventoryItem(tenantId, closed.item_id, {
        status: "available",
        assigned_to: null,
      });
    }
  }

  const surface = await getInventoryItemSurface(closed.item_id, tenantId);
  if (!surface) throw new Error("INVENTORY_ITEM_NOT_FOUND");
  return surface;
}

export async function logMaintenance(
  itemId: string,
  payload: Omit<MaintenanceInput, "itemId" | "tenantId"> & {
    tenantId: string;
  },
): Promise<InventoryItemSurface> {
  await assertTenantAccess(payload.tenantId);

  const item = await getInventoryItem(itemId, payload.tenantId);
  if (!item) throw new Error("INVENTORY_ITEM_NOT_FOUND");

  await createMaintenanceRecord(payload.tenantId, {
    item_id: itemId,
    kind: payload.kind,
    status: payload.status,
    summary: payload.summary,
    notes: payload.notes ?? null,
    cost: payload.cost ?? null,
    vendor: payload.vendor ?? null,
    performed_by: payload.performedBy ?? null,
    scheduled_for: payload.scheduledFor ?? null,
    performed_at: payload.performedAt ?? null,
    completed_at: payload.completedAt ?? null,
    next_due_at: payload.nextDueAt ?? null,
    created_by: payload.createdBy ?? null,
  });

  const nextStatus =
    payload.status === "in_progress" || payload.status === "scheduled"
      ? "maintenance"
      : payload.status === "completed" && item.status === "maintenance"
        ? "available"
        : item.status;

  if (nextStatus !== item.status) {
    await updateInventoryItem(payload.tenantId, itemId, { status: nextStatus });
  }

  const surface = await getInventoryItemSurface(itemId, payload.tenantId);
  if (!surface) throw new Error("INVENTORY_ITEM_NOT_FOUND");
  return surface;
}
