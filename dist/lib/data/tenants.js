import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "tenants";
function store() {
    const g = globalThis;
    if (!g.__ziro_tenants_store)
        g.__ziro_tenants_store = new Map();
    return g.__ziro_tenants_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `tnt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function merge(existing, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    const id = (_b = (_a = input.id) !== null && _a !== void 0 ? _a : existing === null || existing === void 0 ? void 0 : existing.id) !== null && _b !== void 0 ? _b : uuid();
    const now = nowIso();
    return {
        id,
        name: (_d = (_c = input.name) !== null && _c !== void 0 ? _c : existing === null || existing === void 0 ? void 0 : existing.name) !== null && _d !== void 0 ? _d : "Untitled tenant",
        slug: (_f = (_e = input.slug) !== null && _e !== void 0 ? _e : existing === null || existing === void 0 ? void 0 : existing.slug) !== null && _f !== void 0 ? _f : null,
        logo_url: (_h = (_g = input.logo_url) !== null && _g !== void 0 ? _g : existing === null || existing === void 0 ? void 0 : existing.logo_url) !== null && _h !== void 0 ? _h : null,
        primary_color: (_k = (_j = input.primary_color) !== null && _j !== void 0 ? _j : existing === null || existing === void 0 ? void 0 : existing.primary_color) !== null && _k !== void 0 ? _k : null,
        accent_color: (_m = (_l = input.accent_color) !== null && _l !== void 0 ? _l : existing === null || existing === void 0 ? void 0 : existing.accent_color) !== null && _m !== void 0 ? _m : null,
        timezone: (_p = (_o = input.timezone) !== null && _o !== void 0 ? _o : existing === null || existing === void 0 ? void 0 : existing.timezone) !== null && _p !== void 0 ? _p : "America/New_York",
        locale: (_r = (_q = input.locale) !== null && _q !== void 0 ? _q : existing === null || existing === void 0 ? void 0 : existing.locale) !== null && _r !== void 0 ? _r : "en-US",
        status: (_t = (_s = input.status) !== null && _s !== void 0 ? _s : existing === null || existing === void 0 ? void 0 : existing.status) !== null && _t !== void 0 ? _t : "active",
        plan: (_v = (_u = input.plan) !== null && _u !== void 0 ? _u : existing === null || existing === void 0 ? void 0 : existing.plan) !== null && _v !== void 0 ? _v : null,
        created_at: (_w = existing === null || existing === void 0 ? void 0 : existing.created_at) !== null && _w !== void 0 ? _w : now,
        updated_at: now,
    };
}
export async function getTenant(id) {
    var _a, _b;
    if (tableMissing(TABLE))
        return (_a = store().get(id)) !== null && _a !== void 0 ? _a : null;
    try {
        const supabase = clientFor(id);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return (_b = store().get(id)) !== null && _b !== void 0 ? _b : null;
        }
        throw err;
    }
}
export async function listTenants() {
    if (tableMissing(TABLE)) {
        return Array.from(store().values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    try {
        const supabase = clientFor(null);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .order("name", { ascending: true });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return listTenants();
        }
        throw err;
    }
}
export async function upsertTenant(input) {
    const existing = input.id ? await getTenant(input.id) : null;
    const next = merge(existing !== null && existing !== void 0 ? existing : undefined, input);
    if (tableMissing(TABLE)) {
        store().set(next.id, next);
        return next;
    }
    try {
        const supabase = clientFor(next.id);
        const { data, error } = await supabase
            .from(TABLE)
            .upsert(next, { onConflict: "id" })
            .select("*")
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            store().set(next.id, next);
            return next;
        }
        throw err;
    }
}
