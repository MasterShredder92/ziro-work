import { randomUUID } from "crypto";
import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "progress_evidence";
const g = globalThis;
function store() {
    if (!g.__ziro_progress_evidence_store)
        g.__ziro_progress_evidence_store = new Map();
    return g.__ziro_progress_evidence_store;
}
export async function listEvidence(filter, tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*");
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            if (filter.checkpoint_id)
                query = query.eq("checkpoint_id", filter.checkpoint_id);
            if (filter.skill_id)
                query = query.eq("skill_id", filter.skill_id);
            if (filter.goal_id)
                query = query.eq("goal_id", filter.goal_id);
            if (filter.student_id)
                query = query.eq("student_id", filter.student_id);
            if (filter.kind)
                query = query.eq("kind", filter.kind);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 2000,
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
        .filter((r) => filter.checkpoint_id ? r.checkpoint_id === filter.checkpoint_id : true)
        .filter((r) => (filter.skill_id ? r.skill_id === filter.skill_id : true))
        .filter((r) => (filter.goal_id ? r.goal_id === filter.goal_id : true))
        .filter((r) => (filter.student_id ? r.student_id === filter.student_id : true))
        .filter((r) => (filter.kind ? r.kind === filter.kind : true))
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export async function upsertEvidence(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const now = new Date().toISOString();
    const row = {
        id: (_a = input.id) !== null && _a !== void 0 ? _a : randomUUID(),
        tenant_id: input.tenant_id,
        checkpoint_id: input.checkpoint_id,
        skill_id: (_b = input.skill_id) !== null && _b !== void 0 ? _b : null,
        goal_id: (_c = input.goal_id) !== null && _c !== void 0 ? _c : null,
        student_id: input.student_id,
        body: (_d = input.body) !== null && _d !== void 0 ? _d : null,
        kind: (_e = input.kind) !== null && _e !== void 0 ? _e : "note",
        file_url: (_f = input.file_url) !== null && _f !== void 0 ? _f : null,
        file_name: (_g = input.file_name) !== null && _g !== void 0 ? _g : null,
        file_mime: (_h = input.file_mime) !== null && _h !== void 0 ? _h : null,
        file_size_bytes: (_j = input.file_size_bytes) !== null && _j !== void 0 ? _j : null,
        submitted_by: (_k = input.submitted_by) !== null && _k !== void 0 ? _k : null,
        submitter_role: (_l = input.submitter_role) !== null && _l !== void 0 ? _l : null,
        teacher_feedback: (_m = input.teacher_feedback) !== null && _m !== void 0 ? _m : null,
        teacher_id: (_o = input.teacher_id) !== null && _o !== void 0 ? _o : null,
        score: (_p = input.score) !== null && _p !== void 0 ? _p : null,
        created_at: (_q = input.created_at) !== null && _q !== void 0 ? _q : now,
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
