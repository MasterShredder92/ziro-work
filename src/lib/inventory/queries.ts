import {
  listInventoryItems as listInventoryItemsData,
  getInventoryItem as getInventoryItemData,
  upsertInventoryItem as upsertInventoryItemData,
  type InventoryItemRow,
  type InventoryItemFilter,
} from "@data/inventoryItems";
import {
  listInventoryStock as listInventoryStockData,
  upsertInventoryStock as upsertInventoryStockData,
  type InventoryStockRow,
} from "@data/inventoryStock";
import {
  listInventoryCheckouts as listInventoryCheckoutsData,
  upsertInventoryCheckout as upsertInventoryCheckoutData,
  getInventoryCheckout as getInventoryCheckoutData,
  type InventoryCheckoutRow,
  type InventoryCheckoutFilter,
} from "@data/inventoryCheckouts";
import {
  listInventoryMaintenance as listInventoryMaintenanceData,
  upsertInventoryMaintenance as upsertInventoryMaintenanceData,
  type InventoryMaintenanceRow,
  type InventoryMaintenanceFilter,
} from "@data/inventoryMaintenance";

export async function listInventoryItems(
  tenantId: string,
  filter?: InventoryItemFilter,
): Promise<InventoryItemRow[]> {
  return listInventoryItemsData(tenantId, filter);
}

export async function getInventoryItem(
  itemId: string,
  tenantId?: string,
): Promise<InventoryItemRow | null> {
  return getInventoryItemData(itemId, tenantId);
}

export async function listStock(
  itemId: string,
  tenantId?: string,
): Promise<InventoryStockRow[]> {
  return listInventoryStockData({ item_id: itemId }, tenantId);
}

export async function listCheckouts(
  itemId: string,
  tenantId?: string,
  filter?: Omit<InventoryCheckoutFilter, "item_id">,
): Promise<InventoryCheckoutRow[]> {
  return listInventoryCheckoutsData(
    { ...filter, item_id: itemId },
    tenantId,
  );
}

export async function listMaintenance(
  itemId: string,
  tenantId?: string,
  filter?: Omit<InventoryMaintenanceFilter, "item_id">,
): Promise<InventoryMaintenanceRow[]> {
  return listInventoryMaintenanceData(
    { ...filter, item_id: itemId },
    tenantId,
  );
}

export async function createInventoryItem(
  tenantId: string,
  data: Partial<InventoryItemRow> & { name: string },
): Promise<InventoryItemRow> {
  return upsertInventoryItemData(tenantId, data);
}

export async function updateInventoryItem(
  tenantId: string,
  itemId: string,
  data: Partial<InventoryItemRow>,
): Promise<InventoryItemRow> {
  return upsertInventoryItemData(tenantId, { ...data, id: itemId });
}

export async function createCheckout(
  tenantId: string,
  data: Partial<InventoryCheckoutRow> & {
    item_id: string;
    profile_id: string;
  },
): Promise<InventoryCheckoutRow> {
  return upsertInventoryCheckoutData(tenantId, data);
}

export async function closeCheckout(
  tenantId: string,
  checkoutId: string,
  patch?: Partial<InventoryCheckoutRow>,
): Promise<InventoryCheckoutRow | null> {
  const existing = await getInventoryCheckoutData(checkoutId, tenantId);
  if (!existing) return null;
  const now = new Date().toISOString();
  return upsertInventoryCheckoutData(tenantId, {
    ...existing,
    ...patch,
    id: checkoutId,
    item_id: existing.item_id,
    profile_id: existing.profile_id,
    status: patch?.status ?? "returned",
    returned_at: patch?.returned_at ?? now,
  });
}

export async function getCheckout(
  checkoutId: string,
  tenantId?: string,
): Promise<InventoryCheckoutRow | null> {
  return getInventoryCheckoutData(checkoutId, tenantId);
}

export async function createMaintenanceRecord(
  tenantId: string,
  data: Partial<InventoryMaintenanceRow> & {
    item_id: string;
    summary?: string;
  },
): Promise<InventoryMaintenanceRow> {
  return upsertInventoryMaintenanceData(tenantId, data);
}

export async function upsertStock(
  tenantId: string,
  data: Partial<InventoryStockRow> & { item_id: string },
): Promise<InventoryStockRow> {
  return upsertInventoryStockData(tenantId, data);
}
