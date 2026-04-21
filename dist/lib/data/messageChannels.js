import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "message_channels";
const g = globalThis;
function store() {
    if (!g.__ziro_message_channels_store)
        g.__ziro_message_channels_store = new Map();
    return g.__ziro_message_channels_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `chn_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        channel_type: ((_c = input.channel_type) !== null && _c !== void 0 ? _c : "in_app"),
        label: String((_d = input.label) !== null && _d !== void 0 ? _d : "In-app"),
        is_active: (_e = input.is_active) !== null && _e !== void 0 ? _e : true,
        is_default: (_f = input.is_default) !== null && _f !== void 0 ? _f : false,
        config: input.config && typeof input.config === "object" ? input.config : null,
        created_at: (_g = input.created_at) !== null && _g !== void 0 ? _g : now,
        updated_at: (_h = input.updated_at) !== null && _h !== void 0 ? _h : now,
    };
}
const DEFAULT_CHANNELS = [
    { channel_type: "in_app", label: "In-app", is_default: true },
    { channel_type: "email", label: "Email", is_default: false },
    { channel_type: "sms", label: "SMS", is_default: false },
    { channel_type: "push", label: "Push", is_default: false },
];
function seedDefaults(tenantId) {
    const existing = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
    if (existing.length > 0)
        return existing;
    const seeded = DEFAULT_CHANNELS.map((c) => normalize({ tenant_id: tenantId, channel_type: c.channel_type, label: c.label, is_default: c.is_default }));
    for (const row of seeded)
        store().set(row.id, row);
    return seeded;
}
export async function listChannels(tenantId, filter, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.channel_type)
                query = query.eq("channel_type", filter.channel_type);
            if (typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean")
                query = query.eq("is_active", filter.is_active);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "channel_type",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : true,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 100,
            });
            const { data, error } = await ordered;
            if (!error) {
                const rows = (data !== null && data !== void 0 ? data : []);
                return rows.length > 0 ? rows : seedDefaults(tenantId);
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
    const seeded = seedDefaults(tenantId);
    return seeded
        .filter((r) => (filter === null || filter === void 0 ? void 0 : filter.channel_type) ? r.channel_type === filter.channel_type : true)
        .filter((r) => typeof (filter === null || filter === void 0 ? void 0 : filter.is_active) === "boolean"
        ? r.is_active === filter.is_active
        : true);
}
export async function upsertChannel(tenantId, input) {
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
