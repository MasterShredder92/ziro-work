import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "message_participants";
const g = globalThis;
function store() {
    if (!g.__ziro_message_participants_store)
        g.__ziro_message_participants_store = new Map();
    return g.__ziro_message_participants_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `pcp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        thread_id: String((_c = input.thread_id) !== null && _c !== void 0 ? _c : ""),
        profile_id: String((_d = input.profile_id) !== null && _d !== void 0 ? _d : ""),
        role: ((_e = input.role) !== null && _e !== void 0 ? _e : "member"),
        is_muted: Boolean((_f = input.is_muted) !== null && _f !== void 0 ? _f : false),
        last_read_at: (_g = input.last_read_at) !== null && _g !== void 0 ? _g : null,
        joined_at: (_h = input.joined_at) !== null && _h !== void 0 ? _h : now,
        created_at: (_j = input.created_at) !== null && _j !== void 0 ? _j : now,
        updated_at: (_k = input.updated_at) !== null && _k !== void 0 ? _k : now,
    };
}
export async function listParticipants(tenantId, filter, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.thread_id)
                query = query.eq("thread_id", filter.thread_id);
            if (filter === null || filter === void 0 ? void 0 : filter.profile_id)
                query = query.eq("profile_id", filter.profile_id);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "joined_at",
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
        .filter((r) => r.tenant_id === tenantId)
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.thread_id) ? r.thread_id === filter.thread_id : true))
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.profile_id) ? r.profile_id === filter.profile_id : true)
        .sort((a, b) => a.joined_at.localeCompare(b.joined_at));
}
export async function upsertParticipant(tenantId, input) {
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
export async function removeParticipant(participantId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("id", participantId)
                .eq("tenant_id", tenantId);
            if (!error) {
                store().delete(participantId);
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
    store().delete(participantId);
}
