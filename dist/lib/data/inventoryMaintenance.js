import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "inventory_maintenance";
const g = globalThis;
function store() {
    if (!g.__ziro_inventory_maintenance_store)
        g.__ziro_inventory_maintenance_store = new Map();
    return g.__ziro_inventory_maintenance_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `mnt_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const now = nowIso();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : newId(),
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        item_id: String((_c = input.item_id) !== null && _c !== void 0 ? _c : ""),
        kind: ((_d = input.kind) !== null && _d !== void 0 ? _d : "inspection"),
        status: ((_e = input.status) !== null && _e !== void 0 ? _e : "scheduled"),
        summary: String((_f = input.summary) !== null && _f !== void 0 ? _f : "Maintenance"),
        notes: (_g = input.notes) !== null && _g !== void 0 ? _g : null,
        cost: (_h = input.cost) !== null && _h !== void 0 ? _h : null,
        vendor: (_j = input.vendor) !== null && _j !== void 0 ? _j : null,
        performed_by: (_k = input.performed_by) !== null && _k !== void 0 ? _k : null,
        scheduled_for: (_l = input.scheduled_for) !== null && _l !== void 0 ? _l : null,
        performed_at: (_m = input.performed_at) !== null && _m !== void 0 ? _m : null,
        completed_at: (_o = input.completed_at) !== null && _o !== void 0 ? _o : null,
        next_due_at: (_p = input.next_due_at) !== null && _p !== void 0 ? _p : null,
        created_by: (_q = input.created_by) !== null && _q !== void 0 ? _q : null,
        created_at: (_r = input.created_at) !== null && _r !== void 0 ? _r : now,
        updated_at: now,
    };
}
export async function listInventoryMaintenance(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.item_id)
                query = query.eq("item_id", filter.item_id);
            if (filter.status)
                query = query.eq("status", filter.status);
            if (filter.kind)
                query = query.eq("kind", filter.kind);
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
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .filter((r) => (filter.kind ? r.kind === filter.kind : true))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function upsertInventoryMaintenance(tenantId, input) {
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
