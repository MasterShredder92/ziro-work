import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { closeCheckout, createCheckout, createMaintenanceRecord, getCheckout, getInventoryItem, listCheckouts, listInventoryItems, listMaintenance, listStock, updateInventoryItem, } from "./queries";
const DEPRECIATION_STEPS = 12;
const LOW_STOCK_FALLBACK = 1;
function nowIso() {
    return new Date().toISOString();
}
function monthsBetween(from, to) {
    if (!from)
        return 0;
    const start = new Date(from);
    if (Number.isNaN(start.getTime()))
        return 0;
    const months = (to.getFullYear() - start.getFullYear()) * 12 +
        (to.getMonth() - start.getMonth());
    return Math.max(0, months);
}
export function computeDepreciation(item) {
    var _a, _b, _c, _d;
    const purchasePrice = Number((_a = item.purchase_price) !== null && _a !== void 0 ? _a : 0);
    const salvageValue = Number((_b = item.salvage_value) !== null && _b !== void 0 ? _b : 0);
    const usefulLifeMonths = Math.max(1, Number((_c = item.useful_life_months) !== null && _c !== void 0 ? _c : 0) || 0);
    const method = (_d = item.depreciation_method) !== null && _d !== void 0 ? _d : "straight_line";
    const now = new Date();
    const monthsElapsed = monthsBetween(item.purchase_date, now);
    const depreciable = Math.max(0, purchasePrice - salvageValue);
    const curve = [];
    const purchaseStart = item.purchase_date
        ? new Date(item.purchase_date)
        : now;
    const totalMonths = Math.max(usefulLifeMonths, DEPRECIATION_STEPS);
    const step = Math.max(1, Math.floor(totalMonths / DEPRECIATION_STEPS));
    const valueAt = (m) => {
        if (method === "none")
            return purchasePrice;
        if (purchasePrice <= 0)
            return 0;
        if (method === "declining") {
            const ratio = Math.max(0, 1 - Math.min(1, m / Math.max(1, usefulLifeMonths)));
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
    const currentValue = typeof item.current_value === "number"
        ? Number(item.current_value)
        : valueAt(monthsElapsed);
    const accumulated = Math.max(0, purchasePrice - currentValue);
    const percentRemaining = purchasePrice > 0
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
function roundTo(value, digits) {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
}
function isOverdue(checkout, now) {
    if (checkout.returned_at)
        return false;
    if (checkout.status === "overdue")
        return true;
    if (!checkout.due_date)
        return false;
    const due = new Date(checkout.due_date);
    if (Number.isNaN(due.getTime()))
        return false;
    return due.getTime() < now.getTime();
}
function sumStock(stock) {
    return stock.reduce((acc, s) => {
        var _a, _b;
        return ({
            onHand: acc.onHand + ((_a = s.quantity_on_hand) !== null && _a !== void 0 ? _a : 0),
            reserved: acc.reserved + ((_b = s.quantity_reserved) !== null && _b !== void 0 ? _b : 0),
        });
    }, { onHand: 0, reserved: 0 });
}
function summarizeItem(item, checkouts, stock, maintenance, now) {
    const active = checkouts.filter((c) => !c.returned_at);
    const overdue = active.filter((c) => isOverdue(c, now));
    const { onHand } = sumStock(stock);
    const open = maintenance.filter((m) => m.status === "scheduled" || m.status === "in_progress");
    const lastCompleted = maintenance
        .filter((m) => m.status === "completed")
        .map((m) => { var _a; return (_a = m.completed_at) !== null && _a !== void 0 ? _a : m.updated_at; })
        .sort((a, b) => (b !== null && b !== void 0 ? b : "").localeCompare(a !== null && a !== void 0 ? a : ""))[0];
    return {
        item,
        activeCheckouts: active.length,
        overdueCheckouts: overdue.length,
        totalOnHand: onHand || item.quantity,
        openMaintenance: open.length,
        lastMaintenanceAt: lastCompleted !== null && lastCompleted !== void 0 ? lastCompleted : null,
    };
}
export async function getInventoryDashboard(tenantId) {
    var _a, _b, _c;
    await assertTenantAccess(tenantId);
    const items = await listInventoryItems(tenantId);
    const now = new Date();
    const checkoutsByItem = new Map();
    const stockByItem = new Map();
    const maintenanceByItem = new Map();
    await Promise.all(items.map(async (item) => {
        const [checkouts, stock, maintenance] = await Promise.all([
            listCheckouts(item.id, tenantId),
            listStock(item.id, tenantId),
            listMaintenance(item.id, tenantId),
        ]);
        checkoutsByItem.set(item.id, checkouts);
        stockByItem.set(item.id, stock);
        maintenanceByItem.set(item.id, maintenance);
    }));
    const summaries = items.map((item) => {
        var _a, _b, _c;
        return summarizeItem(item, (_a = checkoutsByItem.get(item.id)) !== null && _a !== void 0 ? _a : [], (_b = stockByItem.get(item.id)) !== null && _b !== void 0 ? _b : [], (_c = maintenanceByItem.get(item.id)) !== null && _c !== void 0 ? _c : [], now);
    });
    const allCheckouts = Array.from(checkoutsByItem.values()).flat();
    const allMaintenance = Array.from(maintenanceByItem.values()).flat();
    const overdue = allCheckouts.filter((c) => isOverdue(c, now));
    const maintenanceDue = allMaintenance.filter((m) => {
        if (m.status === "scheduled" || m.status === "in_progress")
            return true;
        if (m.next_due_at) {
            const due = new Date(m.next_due_at);
            if (!Number.isNaN(due.getTime()) && due.getTime() <= now.getTime())
                return true;
        }
        return false;
    });
    const byCategoryMap = new Map();
    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    let lowStockItems = 0;
    for (const item of items) {
        byCategoryMap.set(item.category, ((_a = byCategoryMap.get(item.category)) !== null && _a !== void 0 ? _a : 0) + 1);
        totalPurchaseValue += Number((_b = item.purchase_price) !== null && _b !== void 0 ? _b : 0);
        const dep = computeDepreciation(item);
        totalCurrentValue += dep.currentValue;
        const stockList = (_c = stockByItem.get(item.id)) !== null && _c !== void 0 ? _c : [];
        const { onHand } = sumStock(stockList);
        const effective = onHand || item.quantity;
        const threshold = typeof item.reorder_threshold === "number"
            ? item.reorder_threshold
            : LOW_STOCK_FALLBACK;
        if (effective <= threshold && item.category === "consumable") {
            lowStockItems += 1;
        }
    }
    const totalQuantity = items.reduce((acc, i) => { var _a; return acc + ((_a = i.quantity) !== null && _a !== void 0 ? _a : 0); }, 0);
    const kpis = {
        totalItems: items.length,
        totalQuantity,
        itemsAvailable: items.filter((i) => i.status === "available").length,
        itemsInUse: items.filter((i) => i.status === "in_use").length,
        itemsMaintenance: items.filter((i) => i.status === "maintenance").length,
        itemsRetired: items.filter((i) => i.status === "retired").length,
        activeCheckouts: allCheckouts.filter((c) => !c.returned_at).length,
        overdueCheckouts: overdue.length,
        maintenanceDue: maintenanceDue.length,
        maintenanceInProgress: allMaintenance.filter((m) => m.status === "in_progress").length,
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
export async function getInventoryItemSurface(itemId, tenantId) {
    await assertTenantAccess(tenantId);
    const item = await getInventoryItem(itemId, tenantId);
    if (!item)
        return null;
    const [stock, checkouts, maintenance] = await Promise.all([
        listStock(itemId, tenantId),
        listCheckouts(itemId, tenantId),
        listMaintenance(itemId, tenantId),
    ]);
    const now = new Date();
    const active = checkouts.filter((c) => !c.returned_at);
    const { onHand, reserved } = sumStock(stock);
    const open = maintenance.filter((m) => m.status === "scheduled" || m.status === "in_progress");
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
export async function checkoutItem(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    await assertTenantAccess(input.tenantId);
    const item = await getInventoryItem(input.itemId, input.tenantId);
    if (!item)
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    await createCheckout(input.tenantId, {
        item_id: input.itemId,
        profile_id: input.profileId,
        student_id: (_a = input.studentId) !== null && _a !== void 0 ? _a : null,
        teacher_id: (_b = input.teacherId) !== null && _b !== void 0 ? _b : null,
        location_id: (_d = (_c = input.locationId) !== null && _c !== void 0 ? _c : item.location_id) !== null && _d !== void 0 ? _d : null,
        due_date: (_e = input.dueDate) !== null && _e !== void 0 ? _e : null,
        quantity: (_f = input.quantity) !== null && _f !== void 0 ? _f : 1,
        condition_at_checkout: (_g = input.conditionAtCheckout) !== null && _g !== void 0 ? _g : item.condition,
        notes: (_h = input.notes) !== null && _h !== void 0 ? _h : null,
        checked_out_by: (_j = input.checkedOutBy) !== null && _j !== void 0 ? _j : input.profileId,
        status: "active",
    });
    if (item.status === "available") {
        await updateInventoryItem(input.tenantId, input.itemId, {
            status: "in_use",
            assigned_to: input.profileId,
        });
    }
    const surface = await getInventoryItemSurface(input.itemId, input.tenantId);
    if (!surface)
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    return surface;
}
export async function returnItem(checkoutId, tenantId, patch) {
    var _a, _b, _c;
    await assertTenantAccess(tenantId);
    const existing = await getCheckout(checkoutId, tenantId);
    if (!existing)
        throw new Error("INVENTORY_CHECKOUT_NOT_FOUND");
    const closed = await closeCheckout(tenantId, checkoutId, {
        status: "returned",
        condition_at_return: (_a = patch === null || patch === void 0 ? void 0 : patch.conditionAtReturn) !== null && _a !== void 0 ? _a : null,
        notes: (_b = patch === null || patch === void 0 ? void 0 : patch.notes) !== null && _b !== void 0 ? _b : existing.notes,
        returned_by: (_c = patch === null || patch === void 0 ? void 0 : patch.returnedBy) !== null && _c !== void 0 ? _c : null,
    });
    if (!closed)
        throw new Error("INVENTORY_CHECKOUT_NOT_FOUND");
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
    if (!surface)
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    return surface;
}
export async function logMaintenance(itemId, payload) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    await assertTenantAccess(payload.tenantId);
    const item = await getInventoryItem(itemId, payload.tenantId);
    if (!item)
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    await createMaintenanceRecord(payload.tenantId, {
        item_id: itemId,
        kind: payload.kind,
        status: payload.status,
        summary: payload.summary,
        notes: (_a = payload.notes) !== null && _a !== void 0 ? _a : null,
        cost: (_b = payload.cost) !== null && _b !== void 0 ? _b : null,
        vendor: (_c = payload.vendor) !== null && _c !== void 0 ? _c : null,
        performed_by: (_d = payload.performedBy) !== null && _d !== void 0 ? _d : null,
        scheduled_for: (_e = payload.scheduledFor) !== null && _e !== void 0 ? _e : null,
        performed_at: (_f = payload.performedAt) !== null && _f !== void 0 ? _f : null,
        completed_at: (_g = payload.completedAt) !== null && _g !== void 0 ? _g : null,
        next_due_at: (_h = payload.nextDueAt) !== null && _h !== void 0 ? _h : null,
        created_by: (_j = payload.createdBy) !== null && _j !== void 0 ? _j : null,
    });
    const nextStatus = payload.status === "in_progress" || payload.status === "scheduled"
        ? "maintenance"
        : payload.status === "completed" && item.status === "maintenance"
            ? "available"
            : item.status;
    if (nextStatus !== item.status) {
        await updateInventoryItem(payload.tenantId, itemId, { status: nextStatus });
    }
    const surface = await getInventoryItemSurface(itemId, payload.tenantId);
    if (!surface)
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    return surface;
}
