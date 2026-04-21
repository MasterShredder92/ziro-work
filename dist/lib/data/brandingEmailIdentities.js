import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "branding_email_identities";
const g = globalThis;
function store() {
    if (!g.__ziro_branding_email_identities_store)
        g.__ziro_branding_email_identities_store = new Map();
    return g.__ziro_branding_email_identities_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `eid_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
export function normalizeEmail(input) {
    return String(input !== null && input !== void 0 ? input : "").trim().toLowerCase();
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        from_name: String((_c = input.from_name) !== null && _c !== void 0 ? _c : "Workspace"),
        from_email: normalizeEmail((_d = input.from_email) !== null && _d !== void 0 ? _d : "noreply@ziro.work"),
        reply_to_email: input.reply_to_email ? normalizeEmail(input.reply_to_email) : null,
        status: ((_e = input.status) !== null && _e !== void 0 ? _e : "pending"),
        verified_at: (_f = input.verified_at) !== null && _f !== void 0 ? _f : null,
        last_tested_at: (_g = input.last_tested_at) !== null && _g !== void 0 ? _g : null,
        failure_reason: (_h = input.failure_reason) !== null && _h !== void 0 ? _h : null,
        is_primary: (_j = input.is_primary) !== null && _j !== void 0 ? _j : false,
        created_at: (_k = input.created_at) !== null && _k !== void 0 ? _k : now,
        updated_at: (_l = input.updated_at) !== null && _l !== void 0 ? _l : now,
    };
}
export async function listBrandingEmailIdentities(tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 100,
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
export async function getPrimaryBrandingEmailIdentity(tenantId) {
    var _a, _b;
    const rows = await listBrandingEmailIdentities(tenantId);
    return (_b = (_a = rows.find((r) => r.is_primary)) !== null && _a !== void 0 ? _a : rows[0]) !== null && _b !== void 0 ? _b : null;
}
export async function getBrandingEmailIdentity(id, tenantId) {
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
export async function upsertBrandingEmailIdentity(tenantId, input) {
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
export async function deleteBrandingEmailIdentity(id, tenantId) {
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
