import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "programs";
const g = globalThis;
function store() {
    if (!g.__ziro_programs_store)
        g.__ziro_programs_store = new Map();
    return g.__ziro_programs_store;
}
export async function listPrograms(tenantId, filter, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean")
                query = query.eq("is_active", filter.is_active);
            if (filter === null || filter === void 0 ? void 0 : filter.instrument)
                query = query.eq("instrument", filter.instrument);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "sort_order",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
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
        .filter((r) => (typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean" ? r.is_active === filter.is_active : true))
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.instrument) ? r.instrument === filter.instrument : true))
        .sort((a, b) => { var _a, _b; return ((_a = a.sort_order) !== null && _a !== void 0 ? _a : 0) - ((_b = b.sort_order) !== null && _b !== void 0 ? _b : 0); });
}
export async function getProgram(programId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", programId);
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
    const row = (_a = store().get(programId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
