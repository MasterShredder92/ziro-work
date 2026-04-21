import { listInventoryItems as listInventoryItemsData, getInventoryItem as getInventoryItemData, upsertInventoryItem as upsertInventoryItemData, } from "@data/inventoryItems";
import { listInventoryStock as listInventoryStockData, upsertInventoryStock as upsertInventoryStockData, } from "@data/inventoryStock";
import { listInventoryCheckouts as listInventoryCheckoutsData, upsertInventoryCheckout as upsertInventoryCheckoutData, getInventoryCheckout as getInventoryCheckoutData, } from "@data/inventoryCheckouts";
import { listInventoryMaintenance as listInventoryMaintenanceData, upsertInventoryMaintenance as upsertInventoryMaintenanceData, } from "@data/inventoryMaintenance";
export async function listInventoryItems(tenantId, filter) {
    return listInventoryItemsData(tenantId, filter);
}
export async function getInventoryItem(itemId, tenantId) {
    return getInventoryItemData(itemId, tenantId);
}
export async function listStock(itemId, tenantId) {
    return listInventoryStockData({ item_id: itemId }, tenantId);
}
export async function listCheckouts(itemId, tenantId, filter) {
    return listInventoryCheckoutsData(Object.assign(Object.assign({}, filter), { item_id: itemId }), tenantId);
}
export async function listMaintenance(itemId, tenantId, filter) {
    return listInventoryMaintenanceData(Object.assign(Object.assign({}, filter), { item_id: itemId }), tenantId);
}
export async function createInventoryItem(tenantId, data) {
    return upsertInventoryItemData(tenantId, data);
}
export async function updateInventoryItem(tenantId, itemId, data) {
    return upsertInventoryItemData(tenantId, Object.assign(Object.assign({}, data), { id: itemId }));
}
export async function createCheckout(tenantId, data) {
    return upsertInventoryCheckoutData(tenantId, data);
}
export async function closeCheckout(tenantId, checkoutId, patch) {
    var _a, _b;
    const existing = await getInventoryCheckoutData(checkoutId, tenantId);
    if (!existing)
        return null;
    const now = new Date().toISOString();
    return upsertInventoryCheckoutData(tenantId, Object.assign(Object.assign(Object.assign({}, existing), patch), { id: checkoutId, item_id: existing.item_id, profile_id: existing.profile_id, status: (_a = patch === null || patch === void 0 ? void 0 : patch.status) !== null && _a !== void 0 ? _a : "returned", returned_at: (_b = patch === null || patch === void 0 ? void 0 : patch.returned_at) !== null && _b !== void 0 ? _b : now }));
}
export async function getCheckout(checkoutId, tenantId) {
    return getInventoryCheckoutData(checkoutId, tenantId);
}
export async function createMaintenanceRecord(tenantId, data) {
    return upsertInventoryMaintenanceData(tenantId, data);
}
export async function upsertStock(tenantId, data) {
    return upsertInventoryStockData(tenantId, data);
}
