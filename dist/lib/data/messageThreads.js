import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "message_threads";
const g = globalThis;
function store() {
    if (!g.__ziro_message_threads_store)
        g.__ziro_message_threads_store = new Map();
    return g.__ziro_message_threads_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `thr_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        subject: (_c = input.subject) !== null && _c !== void 0 ? _c : null,
        channel_type: ((_d = input.channel_type) !== null && _d !== void 0 ? _d : "in_app"),
        status: ((_e = input.status) !== null && _e !== void 0 ? _e : "open"),
        participant_ids: Array.isArray(input.participant_ids)
            ? input.participant_ids.filter((p) => typeof p === "string" && p.length > 0)
            : [],
        last_message_preview: (_f = input.last_message_preview) !== null && _f !== void 0 ? _f : null,
        last_message_at: (_g = input.last_message_at) !== null && _g !== void 0 ? _g : null,
        unread_by: input.unread_by && typeof input.unread_by === "object"
            ? input.unread_by
            : null,
        read_by: input.read_by && typeof input.read_by === "object" ? input.read_by : null,
        metadata: input.metadata && typeof input.metadata === "object"
            ? input.metadata
            : null,
        context_type: (_h = input.context_type) !== null && _h !== void 0 ? _h : null,
        context_id: (_j = input.context_id) !== null && _j !== void 0 ? _j : null,
        created_by: (_k = input.created_by) !== null && _k !== void 0 ? _k : null,
        created_at: (_l = input.created_at) !== null && _l !== void 0 ? _l : now,
        updated_at: (_m = input.updated_at) !== null && _m !== void 0 ? _m : now,
    };
}
export async function listThreads(tenantId, filter, opts) {
    var _a, _b, _c, _d, _e;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.status)
                query = query.eq("status", filter.status);
            if (filter === null || filter === void 0 ? void 0 : filter.channel_type)
                query = query.eq("channel_type", filter.channel_type);
            if (filter === null || filter === void 0 ? void 0 : filter.context_type)
                query = query.eq("context_type", filter.context_type);
            if (filter === null || filter === void 0 ? void 0 : filter.context_id)
                query = query.eq("context_id", filter.context_id);
            if (filter === null || filter === void 0 ? void 0 : filter.participant_id) {
                query = query.contains("participant_ids", [filter.participant_id]);
            }
            if ((filter === null || filter === void 0 ? void 0 : filter.search) && filter.search.trim().length > 0) {
                const q = filter.search.trim().replace(/[%_]/g, "\\$&");
                query = query.ilike("subject", `%${q}%`);
            }
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "last_message_at",
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
    const search = (_e = (_d = filter === null || filter === void 0 ? void 0 : filter.search) === null || _d === void 0 ? void 0 : _d.toLowerCase()) !== null && _e !== void 0 ? _e : "";
    return Array.from(store().values())
        .filter((r) => r.tenant_id === tenantId)
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.status) ? r.status === filter.status : true))
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.channel_type) ? r.channel_type === filter.channel_type : true)
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.context_type) ? r.context_type === filter.context_type : true)
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.context_id) ? r.context_id === filter.context_id : true)
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.participant_id)
        ? r.participant_ids.includes(filter.participant_id)
        : true)
        .filter((r) => {
        var _a, _b;
        return search
            ? ((_a = r.subject) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(search) ||
                ((_b = r.last_message_preview) !== null && _b !== void 0 ? _b : "").toLowerCase().includes(search)
            : true;
    })
        .sort((a, b) => {
        var _a, _b;
        return new Date((_a = b.last_message_at) !== null && _a !== void 0 ? _a : b.updated_at).getTime() -
            new Date((_b = a.last_message_at) !== null && _b !== void 0 ? _b : a.updated_at).getTime();
    });
}
export async function getThread(threadId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", threadId);
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
    const row = (_a = store().get(threadId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertThread(tenantId, input) {
    const row = normalize(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
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
export async function deleteThread(threadId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("id", threadId)
                .eq("tenant_id", tenantId);
            if (!error) {
                store().delete(threadId);
                return;
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
    store().delete(threadId);
}
