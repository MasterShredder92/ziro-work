import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "message_deliveries";
const g = globalThis;
function store() {
    if (!g.__ziro_message_deliveries_store)
        g.__ziro_message_deliveries_store = new Map();
    return g.__ziro_message_deliveries_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `dlv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        message_id: String((_c = input.message_id) !== null && _c !== void 0 ? _c : ""),
        thread_id: String((_d = input.thread_id) !== null && _d !== void 0 ? _d : ""),
        recipient_id: String((_e = input.recipient_id) !== null && _e !== void 0 ? _e : ""),
        channel_type: ((_f = input.channel_type) !== null && _f !== void 0 ? _f : "in_app"),
        status: ((_g = input.status) !== null && _g !== void 0 ? _g : "queued"),
        attempts: Number((_h = input.attempts) !== null && _h !== void 0 ? _h : 0),
        error_message: (_j = input.error_message) !== null && _j !== void 0 ? _j : null,
        queued_at: (_k = input.queued_at) !== null && _k !== void 0 ? _k : now,
        sent_at: (_l = input.sent_at) !== null && _l !== void 0 ? _l : null,
        delivered_at: (_m = input.delivered_at) !== null && _m !== void 0 ? _m : null,
        read_at: (_o = input.read_at) !== null && _o !== void 0 ? _o : null,
        failed_at: (_p = input.failed_at) !== null && _p !== void 0 ? _p : null,
        metadata: input.metadata && typeof input.metadata === "object"
            ? input.metadata
            : null,
        created_at: (_q = input.created_at) !== null && _q !== void 0 ? _q : now,
        updated_at: (_r = input.updated_at) !== null && _r !== void 0 ? _r : now,
    };
}
export async function listDeliveries(tenantId, filter, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.message_id)
                query = query.eq("message_id", filter.message_id);
            if (filter === null || filter === void 0 ? void 0 : filter.thread_id)
                query = query.eq("thread_id", filter.thread_id);
            if (filter === null || filter === void 0 ? void 0 : filter.recipient_id)
                query = query.eq("recipient_id", filter.recipient_id);
            if (filter === null || filter === void 0 ? void 0 : filter.channel_type)
                query = query.eq("channel_type", filter.channel_type);
            if (filter === null || filter === void 0 ? void 0 : filter.status)
                query = query.eq("status", filter.status);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "queued_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
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
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.message_id) ? r.message_id === filter.message_id : true))
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.thread_id) ? r.thread_id === filter.thread_id : true))
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.recipient_id) ? r.recipient_id === filter.recipient_id : true)
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.channel_type) ? r.channel_type === filter.channel_type : true)
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.status) ? r.status === filter.status : true))
        .sort((a, b) => b.queued_at.localeCompare(a.queued_at));
}
export async function upsertDelivery(tenantId, input) {
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
