/**
 * @data/reportWidgets facade.
 *
 * Persists widgets that belong to a saved report. Falls back to an
 * in-memory tenant-scoped store when the `report_widgets` table is absent.
 */
import { applyListOptions, clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "report_widgets";
function store() {
    const g = globalThis;
    if (!g.__ziro_report_widgets_store)
        g.__ziro_report_widgets_store = new Map();
    return g.__ziro_report_widgets_store;
}
function nowIso() {
    return new Date().toISOString();
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `widget_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
export async function listWidgetsByReport(reportId, tenantId, opts) {
    var _a, _b;
    if (tableMissing(TABLE)) {
        return Array.from(store().values())
            .filter((w) => w.tenant_id === tenantId && w.report_id === reportId)
            .sort((a, b) => a.position - b.position);
    }
    const supabase = clientFor(tenantId);
    const q = applyListOptions(supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("report_id", reportId), { orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "position", ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true });
    const { data, error } = await q;
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            return listWidgetsByReport(reportId, tenantId, opts);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : []);
}
export async function getWidget(id, tenantId) {
    if (tableMissing(TABLE)) {
        const w = store().get(id);
        return w && w.tenant_id === tenantId ? w : null;
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
            return getWidget(id, tenantId);
        }
        throw error;
    }
    return (data !== null && data !== void 0 ? data : null);
}
export async function upsertWidget(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const now = nowIso();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : uuid(),
        tenant_id: tenantId,
        report_id: input.report_id,
        widget_type: input.widget_type,
        title: (_b = input.title) !== null && _b !== void 0 ? _b : null,
        position: (_c = input.position) !== null && _c !== void 0 ? _c : 0,
        size: (_d = input.size) !== null && _d !== void 0 ? _d : "md",
        config: (_e = input.config) !== null && _e !== void 0 ? _e : null,
        query: (_f = input.query) !== null && _f !== void 0 ? _f : null,
        kpi_key: (_g = input.kpi_key) !== null && _g !== void 0 ? _g : null,
        created_at: (_h = input.created_at) !== null && _h !== void 0 ? _h : now,
        updated_at: now,
    };
    if (tableMissing(TABLE)) {
        store().set(row.id, row);
        return row;
    }
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
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
export async function deleteWidget(id, tenantId) {
    if (tableMissing(TABLE)) {
        const w = store().get(id);
        if (!w || w.tenant_id !== tenantId)
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
            return deleteWidget(id, tenantId);
        }
        throw error;
    }
    return true;
}
export async function deleteWidgetsByReport(reportId, tenantId) {
    if (tableMissing(TABLE)) {
        for (const [id, w] of store().entries()) {
            if (w.tenant_id === tenantId && w.report_id === reportId) {
                store().delete(id);
            }
        }
        return;
    }
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("report_id", reportId);
    if (error) {
        if (isMissingTableError(error, TABLE)) {
            markTableMissing(TABLE);
            return deleteWidgetsByReport(reportId, tenantId);
        }
        throw error;
    }
}
