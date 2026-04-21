import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "student_lesson_progress";
const g = globalThis;
function store() {
    if (!g.__ziro_student_progress_store)
        g.__ziro_student_progress_store = new Map();
    return g.__ziro_student_progress_store;
}
export async function listStudentProgress(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.student_id)
                query = query.eq("student_id", filter.student_id);
            if (filter.lesson_id)
                query = query.eq("lesson_id", filter.lesson_id);
            if (filter.program_id)
                query = query.eq("program_id", filter.program_id);
            if (filter.status)
                query = query.eq("status", filter.status);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 1000,
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
        .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
        .filter((r) => (filter.lesson_id ? r.lesson_id === filter.lesson_id : true))
        .filter((r) => (filter.program_id ? r.program_id === filter.program_id : true))
        .filter((r) => (filter.status ? r.status === filter.status : true))
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
