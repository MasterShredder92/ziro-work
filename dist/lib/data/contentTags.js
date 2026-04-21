import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "content_tags";
const g = globalThis;
function store() {
    if (!g.__ziro_content_tags_store)
        g.__ziro_content_tags_store = new Map();
    return g.__ziro_content_tags_store;
}
function newId() {
    return `ct_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function toSlug(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64) || "tag";
}
function normalize(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    const label = String((_b = input.label) !== null && _b !== void 0 ? _b : "Tag");
    const slug = typeof input.slug === "string" && input.slug.length > 0
        ? input.slug
        : toSlug(label);
    return {
        id,
        tenant_id: String((_c = input.tenant_id) !== null && _c !== void 0 ? _c : ""),
        label,
        slug,
        color: (_d = input.color) !== null && _d !== void 0 ? _d : null,
        description: (_e = input.description) !== null && _e !== void 0 ? _e : null,
        created_at: (_f = input.created_at) !== null && _f !== void 0 ? _f : now,
        updated_at: (_g = input.updated_at) !== null && _g !== void 0 ? _g : now,
        created_by: (_h = input.created_by) !== null && _h !== void 0 ? _h : null,
    };
}
export async function listContentTags(tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .order("label", { ascending: true });
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
        .sort((a, b) => a.label.localeCompare(b.label));
}
export async function getContentTag(tagId, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", tagId);
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
    const row = (_a = store().get(tagId)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function getContentTagBySlug(slug, tenantId) {
    var _a;
    const all = await listContentTags(tenantId);
    return (_a = all.find((t) => t.slug === slug)) !== null && _a !== void 0 ? _a : null;
}
export async function upsertContentTag(tenantId, input) {
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
export async function deleteContentTag(tagId, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).delete().eq("id", tagId);
            if (tenantId)
                query = query.eq("tenant_id", tenantId);
            const { error } = await query;
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
    const row = store().get(tagId);
    if (row && (!tenantId || row.tenant_id === tenantId))
        store().delete(tagId);
}
