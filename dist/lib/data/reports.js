/**
 * @data/reports facade.
 *
 * Persists saved report definitions (distinct from the built-in report
 * registry at `src/lib/reports/definitions.ts`). Falls back to an in-memory
 * tenant-scoped store when the `reports` table is absent from Supabase so
 * the UI keeps working during incremental schema rollouts.
 */
import { applyListOptions, clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "reports";
function store() {
    const g = globalThis;
    if (!g.__ziro_reports_store)
        g.__ziro_reports_store = new Map();
    return g.__ziro_reports_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `report_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function tenantRows(tenantId) {
    return Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
}
function applyFilter(rows, filter) {
    let out = rows;
    if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived)) {
        out = out.filter((r) => r.status !== "archived");
    }
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        out = out.filter((r) => r.status === filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.kind)
        out = out.filter((r) => r.kind === filter.kind);
    if (filter === null || filter === void 0 ? void 0 : filter.search) {
        const q = filter.search.toLowerCase();
        out = out.filter((r) => {
            var _a;
            return r.name.toLowerCase().includes(q) ||
                ((_a = r.description) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(q);
        });
    }
    return out;
}
export async function listReports(tenantId, filter, opts) {
    var _a, _b;
    if (tableMissing(TABLE)) {
        const rows = applyFilter(tenantRows(tenantId), filter).sort((a, b) => a.updated_at > b.updated_at ? -1 : 1);
        if (typeof (opts === null || opts === void 0 ? void 0 : opts.limit) === "number")
            return rows.slice(0, opts.limit);
        return rows;
    }
    const supabase = clientFor(tenantId);
    let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived))
        q = q.neq("status", "archived");
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        q = q.eq("status", filter.status);
    if (filter === null || filter === void 0 ? void 0 : filter.kind)
        q = q.eq("kind", filter.kind);
    if (filter === null || filter === void 0 ? void 0 : filter.search)
        q = q.ilike("name", `%${filter.search}%`);
    q = applyListOptions(q, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: opts === null || opts === void 0 ? void 0 : opts.limit,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await q;
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            return listReports(tenantId, filter, opts);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : []);
}
export async function getReport(id, tenantId) {
    if (tableMissing(TABLE)) {
        const r = store().get(id);
        return r && r.tenant_id === tenantId ? r : null;
    }
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .maybeSingle();
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            return getReport(id, tenantId);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : null);
}
export async function createReport(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const now = nowIso();
    const row = {
        id: uuid(),
        tenant_id: tenantId,
        name: input.name,
        slug: (_a = input.slug) !== null && _a !== void 0 ? _a : null,
        description: (_b = input.description) !== null && _b !== void 0 ? _b : null,
        kind: (_c = input.kind) !== null && _c !== void 0 ? _c : "custom",
        status: (_d = input.status) !== null && _d !== void 0 ? _d : "draft",
        source: (_e = input.source) !== null && _e !== void 0 ? _e : "custom",
        query: (_f = input.query) !== null && _f !== void 0 ? _f : null,
        layout: (_g = input.layout) !== null && _g !== void 0 ? _g : null,
        parameters: (_h = input.parameters) !== null && _h !== void 0 ? _h : [],
        tags: (_j = input.tags) !== null && _j !== void 0 ? _j : [],
        is_pinned: (_k = input.is_pinned) !== null && _k !== void 0 ? _k : false,
        created_at: now,
        updated_at: now,
        created_by: (_l = input.created_by) !== null && _l !== void 0 ? _l : null,
        updated_by: (_m = input.updated_by) !== null && _m !== void 0 ? _m : null,
    };
    if (tableMissing(TABLE)) {
        store().set(row.id, row);
        return row;
    }
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .insert(row)
        .select("*")
        .single();
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            store().set(row.id, row);
            return row;
        }
        throw error;
    }
    return data;
}
export async function updateReport(id, tenantId, patch) {
    const next = Object.assign(Object.assign({}, patch), { updated_at: nowIso() });
    if (tableMissing(TABLE)) {
        const existing = store().get(id);
        if (!existing || existing.tenant_id !== tenantId)
            return null;
        const merged = Object.assign(Object.assign({}, existing), next);
        store().set(id, merged);
        return merged;
    }
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .update(next)
        .eq("tenant_id", tenantId)
        .eq("id", id)
        .select("*")
        .maybeSingle();
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            return updateReport(id, tenantId, patch);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : null);
}
export async function deleteReport(id, tenantId) {
    if (tableMissing(TABLE)) {
        const existing = store().get(id);
        if (!existing || existing.tenant_id !== tenantId)
            return false;
        store().delete(id);
        return true;
    }
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", id);
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            return deleteReport(id, tenantId);
        }
        throw error;
    }
    return true;
}
