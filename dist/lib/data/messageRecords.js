import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "messages";
const g = globalThis;
function store() {
    if (!g.__ziro_messages_store)
        g.__ziro_messages_store = new Map();
    return g.__ziro_messages_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `msg_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    const attachments = Array.isArray(input.attachments) ? input.attachments : [];
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        thread_id: String((_c = input.thread_id) !== null && _c !== void 0 ? _c : ""),
        sender_id: String((_d = input.sender_id) !== null && _d !== void 0 ? _d : ""),
        recipient_ids: Array.isArray(input.recipient_ids)
            ? input.recipient_ids.filter((r) => typeof r === "string" && r.length > 0)
            : [],
        channel_type: ((_e = input.channel_type) !== null && _e !== void 0 ? _e : "in_app"),
        subject: (_f = input.subject) !== null && _f !== void 0 ? _f : null,
        body: String((_g = input.body) !== null && _g !== void 0 ? _g : ""),
        body_html: (_h = input.body_html) !== null && _h !== void 0 ? _h : null,
        template_id: (_j = input.template_id) !== null && _j !== void 0 ? _j : null,
        merge_vars: input.merge_vars && typeof input.merge_vars === "object"
            ? input.merge_vars
            : null,
        attachments,
        delivery_status: ((_k = input.delivery_status) !== null && _k !== void 0 ? _k : "sent"),
        delivery_meta: input.delivery_meta && typeof input.delivery_meta === "object"
            ? input.delivery_meta
            : null,
        reply_to_message_id: (_l = input.reply_to_message_id) !== null && _l !== void 0 ? _l : null,
        created_at: (_m = input.created_at) !== null && _m !== void 0 ? _m : now,
        updated_at: (_o = input.updated_at) !== null && _o !== void 0 ? _o : now,
    };
}
export async function listMessages(tenantId, filter, opts) {
    var _a, _b, _c, _d, _e;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.thread_id)
                query = query.eq("thread_id", filter.thread_id);
            if (filter === null || filter === void 0 ? void 0 : filter.sender_id)
                query = query.eq("sender_id", filter.sender_id);
            if (filter === null || filter === void 0 ? void 0 : filter.channel_type)
                query = query.eq("channel_type", filter.channel_type);
            if (filter === null || filter === void 0 ? void 0 : filter.delivery_status)
                query = query.eq("delivery_status", filter.delivery_status);
            if (filter === null || filter === void 0 ? void 0 : filter.recipient_id)
                query = query.contains("recipient_ids", [filter.recipient_id]);
            if (filter === null || filter === void 0 ? void 0 : filter.since)
                query = query.gte("created_at", filter.since);
            if (filter === null || filter === void 0 ? void 0 : filter.until)
                query = query.lte("created_at", filter.until);
            if ((filter === null || filter === void 0 ? void 0 : filter.search) && filter.search.trim()) {
                const q = filter.search.trim().replace(/[%_]/g, "\\$&");
                query = query.ilike("body", `%${q}%`);
            }
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "created_at",
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
    const search = (_e = (_d = filter === null || filter === void 0 ? void 0 : filter.search) === null || _d === void 0 ? void 0 : _d.toLowerCase()) !== null && _e !== void 0 ? _e : "";
    return Array.from(store().values())
        .filter((r) => r.tenant_id === tenantId)
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.thread_id) ? r.thread_id === filter.thread_id : true))
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.sender_id) ? r.sender_id === filter.sender_id : true))
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.channel_type) ? r.channel_type === filter.channel_type : true)
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.delivery_status) ? r.delivery_status === filter.delivery_status : true)
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.recipient_id) ? r.recipient_ids.includes(filter.recipient_id) : true)
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.since) ? r.created_at >= filter.since : true))
        .filter((r) => ((filter === null || filter === void 0 ? void 0 : filter.until) ? r.created_at <= filter.until : true))
        .filter((r) => {
        var _a;
        return search
            ? r.body.toLowerCase().includes(search) ||
                ((_a = r.subject) !== null && _a !== void 0 ? _a : "").toLowerCase().includes(search)
            : true;
    })
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
export async function getMessage(messageId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", messageId);
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
    const row = (_a = store().get(messageId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertMessage(tenantId, input) {
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
export async function deleteMessage(messageId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("id", messageId)
                .eq("tenant_id", tenantId);
            if (!error) {
                store().delete(messageId);
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
    store().delete(messageId);
}
