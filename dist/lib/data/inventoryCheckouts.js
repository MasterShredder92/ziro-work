import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "inventory_checkouts";
const g = globalThis;
function store() {
    if (!g.__ziro_inventory_checkouts_store)
        g.__ziro_inventory_checkouts_store = new Map();
    return g.__ziro_inventory_checkouts_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `chk_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    const now = nowIso();
    return {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : newId(),
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        item_id: String((_c = input.item_id) !== null && _c !== void 0 ? _c : ""),
        profile_id: String((_d = input.profile_id) !== null && _d !== void 0 ? _d : ""),
        student_id: (_e = input.student_id) !== null && _e !== void 0 ? _e : null,
        teacher_id: (_f = input.teacher_id) !== null && _f !== void 0 ? _f : null,
        location_id: (_g = input.location_id) !== null && _g !== void 0 ? _g : null,
        checked_out_at: (_h = input.checked_out_at) !== null && _h !== void 0 ? _h : now,
        due_date: (_j = input.due_date) !== null && _j !== void 0 ? _j : null,
        returned_at: (_k = input.returned_at) !== null && _k !== void 0 ? _k : null,
        status: ((_l = input.status) !== null && _l !== void 0 ? _l : "active"),
        quantity: typeof input.quantity === "number" && Number.isFinite(input.quantity)
            ? Math.max(1, Math.floor(input.quantity))
            : 1,
        condition_at_checkout: (_m = input.condition_at_checkout) !== null && _m !== void 0 ? _m : null,
        condition_at_return: (_o = input.condition_at_return) !== null && _o !== void 0 ? _o : null,
        notes: (_p = input.notes) !== null && _p !== void 0 ? _p : null,
        checked_out_by: (_q = input.checked_out_by) !== null && _q !== void 0 ? _q : null,
        returned_by: (_r = input.returned_by) !== null && _r !== void 0 ? _r : null,
        created_at: (_s = input.created_at) !== null && _s !== void 0 ? _s : now,
        updated_at: now,
    };
}
export async function listInventoryCheckouts(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.item_id)
                query = query.eq("item_id", filter.item_id);
            if (filter.profile_id)
                query = query.eq("profile_id", filter.profile_id);
            if (filter.student_id)
                query = query.eq("student_id", filter.student_id);
            if (filter.teacher_id)
                query = query.eq("teacher_id", filter.teacher_id);
            if (filter.status)
                query = query.eq("status", filter.status);
            if (filter.activeOnly)
                query = query.is("returned_at", null);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "checked_out_at",
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
        .filter((r) => (filter.profile_id ? r.profile_id === filter.profile_id : true))
        .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
        .filter((r) => (filter.teacher_id ? r.teacher_id === filter.teacher_id : true))
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .filter((r) => (filter.activeOnly ? r.returned_at == null : true))
        .sort((a, b) => b.checked_out_at.localeCompare(a.checked_out_at));
}
export async function getInventoryCheckout(checkoutId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", checkoutId);
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
    const row = (_a = store().get(checkoutId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertInventoryCheckout(tenantId, input) {
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
