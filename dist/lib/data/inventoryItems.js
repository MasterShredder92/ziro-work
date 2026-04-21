import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "inventory_items";
const g = globalThis;
function store() {
    if (!g.__ziro_inventory_items_store)
        g.__ziro_inventory_items_store = new Map();
    return g.__ziro_inventory_items_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `inv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
    const now = nowIso();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : newId(),
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        location_id: (_c = input.location_id) !== null && _c !== void 0 ? _c : null,
        name: String((_d = input.name) !== null && _d !== void 0 ? _d : "Untitled item"),
        sku: (_e = input.sku) !== null && _e !== void 0 ? _e : null,
        category: ((_f = input.category) !== null && _f !== void 0 ? _f : "instrument"),
        description: (_g = input.description) !== null && _g !== void 0 ? _g : null,
        brand: (_h = input.brand) !== null && _h !== void 0 ? _h : null,
        model: (_j = input.model) !== null && _j !== void 0 ? _j : null,
        serial_number: (_k = input.serial_number) !== null && _k !== void 0 ? _k : null,
        purchase_date: (_l = input.purchase_date) !== null && _l !== void 0 ? _l : null,
        purchase_price: (_m = input.purchase_price) !== null && _m !== void 0 ? _m : null,
        current_value: (_o = input.current_value) !== null && _o !== void 0 ? _o : null,
        salvage_value: (_p = input.salvage_value) !== null && _p !== void 0 ? _p : null,
        useful_life_months: (_q = input.useful_life_months) !== null && _q !== void 0 ? _q : null,
        depreciation_method: ((_r = input.depreciation_method) !== null && _r !== void 0 ? _r : "straight_line"),
        condition: ((_s = input.condition) !== null && _s !== void 0 ? _s : "good"),
        status: ((_t = input.status) !== null && _t !== void 0 ? _t : "available"),
        quantity: typeof input.quantity === "number" && Number.isFinite(input.quantity)
            ? Math.max(0, Math.floor(input.quantity))
            : 1,
        reorder_threshold: (_u = input.reorder_threshold) !== null && _u !== void 0 ? _u : null,
        photo_url: (_v = input.photo_url) !== null && _v !== void 0 ? _v : null,
        notes: (_w = input.notes) !== null && _w !== void 0 ? _w : null,
        tags: Array.isArray(input.tags) ? input.tags : [],
        assigned_to: (_x = input.assigned_to) !== null && _x !== void 0 ? _x : null,
        archived_at: (_y = input.archived_at) !== null && _y !== void 0 ? _y : null,
        created_at: (_z = input.created_at) !== null && _z !== void 0 ? _z : now,
        updated_at: now,
    };
}
function matchesFilter(row, filter) {
    if (!filter)
        return true;
    if (filter.category && row.category !== filter.category)
        return false;
    if (filter.status && row.status !== filter.status)
        return false;
    if (filter.location_id && row.location_id !== filter.location_id)
        return false;
    if (!filter.includeArchived && row.archived_at)
        return false;
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
            if (!hay.includes(t))
                return false;
        }
    }
    return true;
}
export async function listInventoryItems(tenantId, filter, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.category)
                query = query.eq("category", filter.category);
            if (filter === null || filter === void 0 ? void 0 : filter.status)
                query = query.eq("status", filter.status);
            if (filter === null || filter === void 0 ? void 0 : filter.location_id)
                query = query.eq("location_id", filter.location_id);
            if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived))
                query = query.is("archived_at", null);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 500,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error) {
                const rows = (data !== null && data !== void 0 ? data : []);
                if (filter === null || filter === void 0 ? void 0 : filter.search) {
                    return rows.filter((r) => matchesFilter(r, filter));
                }
                return rows;
            }
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
        .filter((r) => r.tenant_id === tenantId)
        .filter((r) => matchesFilter(r, filter))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getInventoryItem(itemId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", itemId);
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            const { data, error } = await query.maybeSingle();
            if (!error)
                return (data !== null && data !== void 0 ? data : null);
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
    const row = (_a = store().get(itemId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertInventoryItem(tenantId, input) {
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
