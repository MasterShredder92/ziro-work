import { randomUUID } from "crypto";
import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "attendance_reasons";
const g = globalThis;
function store() {
    if (!g.__ziro_attendance_reasons_store) {
        g.__ziro_attendance_reasons_store = new Map();
    }
    return g.__ziro_attendance_reasons_store;
}
export async function listAttendanceReasons(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.category)
                query = query.eq("category", filter.category);
            if (typeof filter.is_active === "boolean")
                query = query.eq("is_active", filter.is_active);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "sort_order",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
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
        .filter((r) => (filter.category ? r.category === filter.category : true))
        .filter((r) => typeof filter.is_active === "boolean"
        ? r.is_active === filter.is_active
        : true)
        .sort((a, b) => {
        var _a, _b;
        return ((_a = a.sort_order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sort_order) !== null && _b !== void 0 ? _b : 0) ||
            a.label.localeCompare(b.label);
    });
}
export async function getAttendanceReasonById(id, tenantId) {
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
    if (row && tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertAttendanceReason(input) {
    var _a, _b, _c, _d, _e, _f;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : randomUUID(),
        tenant_id: input.tenant_id,
        code: input.code,
        label: input.label,
        category: (_b = input.category) !== null && _b !== void 0 ? _b : "other",
        is_excused: (_c = input.is_excused) !== null && _c !== void 0 ? _c : false,
        is_active: (_d = input.is_active) !== null && _d !== void 0 ? _d : true,
        sort_order: (_e = input.sort_order) !== null && _e !== void 0 ? _e : 0,
        created_at: (_f = input.created_at) !== null && _f !== void 0 ? _f : now,
        updated_at: now,
    };
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(input.tenant_id);
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
export async function deleteAttendanceReason(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", id);
            if (!error)
                return;
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
    const row = store().get(id);
    if (row && row.tenant_id === tenantId)
        store().delete(id);
}
/**
 * Returns a built-in set of reasons (used as a fallback when the workspace has no
 * customized entries yet). Always tenant-scoped, not persisted.
 */
export function defaultAttendanceReasons(tenantId) {
    const now = new Date().toISOString();
    const base = [
        { code: "illness", label: "Illness", category: "illness", is_excused: true },
        { code: "family_emergency", label: "Family emergency", category: "family", is_excused: true },
        { code: "travel", label: "Travel", category: "travel", is_excused: false },
        { code: "school_event", label: "School event", category: "school", is_excused: true },
        { code: "weather", label: "Weather", category: "weather", is_excused: true },
        { code: "makeup_scheduled", label: "Makeup scheduled", category: "makeup", is_excused: true },
        { code: "no_reason", label: "No reason given", category: "other", is_excused: false },
    ];
    return base.map((b, i) => ({
        id: `builtin-${b.code}`,
        tenant_id: tenantId,
        code: b.code,
        label: b.label,
        category: b.category,
        is_excused: b.is_excused,
        is_active: true,
        sort_order: i,
        created_at: now,
        updated_at: now,
    }));
}
