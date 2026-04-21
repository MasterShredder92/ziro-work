/**
 * @data/reportExportJobs facade.
 *
 * Tracks long-running export jobs (CSV / XLSX / PDF) so the UI can poll
 * for status and download results. Falls back to an in-memory tenant
 * store when the `report_export_jobs` table is absent.
 */
import { applyListOptions, clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "report_export_jobs";
function store() {
    const g = globalThis;
    if (!g.__ziro_report_export_jobs_store)
        g.__ziro_report_export_jobs_store = new Map();
    return g.__ziro_report_export_jobs_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `exp_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
export async function listExportJobs(tenantId, filter, opts) {
    var _a, _b;
    if (tableMissing(TABLE)) {
        let rows = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.reportId)
            rows = rows.filter((r) => r.report_id === filter.reportId);
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            rows = rows.filter((r) => r.status === filter.status);
        rows.sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
        if (typeof (opts === null || opts === void 0 ? void 0 : opts.limit) === "number")
            return rows.slice(0, opts.limit);
        return rows;
    }
    const supabase = clientFor(tenantId);
    let q = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.reportId)
        q = q.eq("report_id", filter.reportId);
    if (filter === null || filter === void 0 ? void 0 : filter.status)
        q = q.eq("status", filter.status);
    q = applyListOptions(q, {
        orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at",
        ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
        limit: opts === null || opts === void 0 ? void 0 : opts.limit,
        offset: opts === null || opts === void 0 ? void 0 : opts.offset,
    });
    const { data, error } = await q;
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            return listExportJobs(tenantId, filter, opts);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : []);
}
export async function getExportJob(id, tenantId) {
    if (tableMissing(TABLE)) {
        const j = store().get(id);
        return j && j.tenant_id === tenantId ? j : null;
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
            return getExportJob(id, tenantId);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : null);
}
export async function createExportJob(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const now = nowIso();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : uuid(),
        tenant_id: tenantId,
        report_id: (_b = input.report_id) !== null && _b !== void 0 ? _b : null,
        format: input.format,
        status: (_c = input.status) !== null && _c !== void 0 ? _c : "pending",
        filename: input.filename,
        content_type: input.content_type,
        size_bytes: (_d = input.size_bytes) !== null && _d !== void 0 ? _d : 0,
        params: (_e = input.params) !== null && _e !== void 0 ? _e : null,
        error: (_f = input.error) !== null && _f !== void 0 ? _f : null,
        content_base64: (_g = input.content_base64) !== null && _g !== void 0 ? _g : null,
        created_at: (_h = input.created_at) !== null && _h !== void 0 ? _h : now,
        updated_at: now,
        completed_at: (_j = input.completed_at) !== null && _j !== void 0 ? _j : null,
        expires_at: (_k = input.expires_at) !== null && _k !== void 0 ? _k : null,
        created_by: (_l = input.created_by) !== null && _l !== void 0 ? _l : null,
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
export async function updateExportJob(id, tenantId, patch) {
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
            return updateExportJob(id, tenantId, patch);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : null);
}
