import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "branding_domains";
const g = globalThis;
function store() {
    if (!g.__ziro_branding_domains_store)
        g.__ziro_branding_domains_store = new Map();
    return g.__ziro_branding_domains_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `dom_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function newToken() {
    const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function normalizeDomainName(input) {
    return String(input !== null && input !== void 0 ? input : "")
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "");
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        domain_name: normalizeDomainName((_c = input.domain_name) !== null && _c !== void 0 ? _c : ""),
        status: ((_d = input.status) !== null && _d !== void 0 ? _d : "pending"),
        verification_token: (_e = input.verification_token) !== null && _e !== void 0 ? _e : newToken(),
        verification_target: (_f = input.verification_target) !== null && _f !== void 0 ? _f : "cname.ziro.work",
        is_primary: (_g = input.is_primary) !== null && _g !== void 0 ? _g : false,
        verified_at: (_h = input.verified_at) !== null && _h !== void 0 ? _h : null,
        last_checked_at: (_j = input.last_checked_at) !== null && _j !== void 0 ? _j : null,
        failure_reason: (_k = input.failure_reason) !== null && _k !== void 0 ? _k : null,
        created_at: (_l = input.created_at) !== null && _l !== void 0 ? _l : now,
        updated_at: (_m = input.updated_at) !== null && _m !== void 0 ? _m : now,
    };
}
export async function listBrandingDomains(tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
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
        .filter((r) => r.tenant_id === tenantId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getBrandingDomain(id, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", id);
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
    const row = (_a = store().get(id)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function getBrandingDomainByName(domainName, tenantId) {
    const normalized = normalizeDomainName(domainName);
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase
                .from(TABLE)
                .select("*")
                .eq("domain_name", normalized);
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
    for (const row of store().values()) {
        if (row.domain_name !== normalized)
            continue;
        if (tenantId && row.tenant_id !== tenantId)
            continue;
        return row;
    }
    return null;
}
export async function upsertBrandingDomain(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "id" })
                .select("*")
                .single();
            if (!error && data) {
                store().set(row.id, data);
                return data;
            }
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
export async function deleteBrandingDomain(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("id", id)
                .eq("tenant_id", tenantId);
            if (!error) {
                store().delete(id);
                return true;
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
    const existing = store().get(id);
    if (existing && existing.tenant_id === tenantId) {
        store().delete(id);
        return true;
    }
    return false;
}
