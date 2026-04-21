import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "inventory_stock";
const g = globalThis;
function store() {
    if (!g.__ziro_inventory_stock_store)
        g.__ziro_inventory_stock_store = new Map();
    return g.__ziro_inventory_stock_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `stock_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const now = nowIso();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : newId(),
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        item_id: String((_c = input.item_id) !== null && _c !== void 0 ? _c : ""),
        location_id: (_d = input.location_id) !== null && _d !== void 0 ? _d : null,
        room_id: (_e = input.room_id) !== null && _e !== void 0 ? _e : null,
        quantity_on_hand: typeof input.quantity_on_hand === "number"
            ? Math.max(0, Math.floor(input.quantity_on_hand))
            : 0,
        quantity_reserved: typeof input.quantity_reserved === "number"
            ? Math.max(0, Math.floor(input.quantity_reserved))
            : 0,
        shelf_label: (_f = input.shelf_label) !== null && _f !== void 0 ? _f : null,
        notes: (_g = input.notes) !== null && _g !== void 0 ? _g : null,
        last_counted_at: (_h = input.last_counted_at) !== null && _h !== void 0 ? _h : null,
        created_at: (_j = input.created_at) !== null && _j !== void 0 ? _j : now,
        updated_at: now,
    };
}
export async function listInventoryStock(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.item_id)
                query = query.eq("item_id", filter.item_id);
            if (filter.location_id)
                query = query.eq("location_id", filter.location_id);
            if (filter.room_id)
                query = query.eq("room_id", filter.room_id);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error)
                return (data !== null && data !== void 0 ? data : []);
            if (isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    return Array.from(store().values())
        .filter((r) => (tenantId ? r.tenant_id === tenantId : true))
        .filter((r) => (filter.item_id ? r.item_id === filter.item_id : true))
        .filter((r) => (filter.location_id ? r.location_id === filter.location_id : true))
        .filter((r) => (filter.room_id ? r.room_id === filter.room_id : true))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function upsertInventoryStock(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "id" })
                .select("*")
                .single();
            if (!error && data)
                return data;
            if (error && isMissingTableError(error, TABLE))
                markTableMissing(TABLE);
            else if (error)
                throw error;
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    store().set(row.id, row);
    return row;
}
