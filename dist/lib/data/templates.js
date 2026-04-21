import { clientFor } from "./_client";
const TEMPLATES_TABLE = "templates";
const TEMPLATE_VERSIONS_TABLE = "template_versions";
const g = globalThis;
function templateStore() {
    if (!g.__ziro_templates_store) {
        g.__ziro_templates_store = new Map();
    }
    return g.__ziro_templates_store;
}
function versionStore() {
    if (!g.__ziro_template_versions_store) {
        g.__ziro_template_versions_store = new Map();
    }
    return g.__ziro_template_versions_store;
}
function isMissingTableError(err, table) {
    if (!err || typeof err !== "object")
        return false;
    const rec = err;
    const code = typeof rec.code === "string" ? rec.code : null;
    const message = typeof rec.message === "string" ? rec.message : "";
    if (code === "42P01")
        return true;
    if (code === "PGRST205")
        return true;
    if (new RegExp(`relation .*${table}.* does not exist`, "i").test(message))
        return true;
    if (new RegExp(`Could not find the table .*${table}`, "i").test(message))
        return true;
    return false;
}
function markTemplatesMissing() {
    g.__ziro_templates_db_missing = true;
}
function markVersionsMissing() {
    g.__ziro_template_versions_db_missing = true;
}
function templatesMissing() {
    return g.__ziro_templates_db_missing === true;
}
function versionsMissing() {
    return g.__ziro_template_versions_db_missing === true;
}
function newId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function nowIso() {
    return new Date().toISOString();
}
function normalizeTemplate(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId("tpl");
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        name: String((_c = input.name) !== null && _c !== void 0 ? _c : "Untitled template"),
        slug: (_d = input.slug) !== null && _d !== void 0 ? _d : null,
        description: (_e = input.description) !== null && _e !== void 0 ? _e : null,
        category: (_f = input.category) !== null && _f !== void 0 ? _f : "general",
        channel: (_g = input.channel) !== null && _g !== void 0 ? _g : "email",
        subject: (_h = input.subject) !== null && _h !== void 0 ? _h : null,
        body: String((_j = input.body) !== null && _j !== void 0 ? _j : ""),
        current_version: typeof input.current_version === "number" && input.current_version > 0
            ? input.current_version
            : 1,
        is_archived: input.is_archived === true,
        created_at: (_k = input.created_at) !== null && _k !== void 0 ? _k : now,
        updated_at: (_l = input.updated_at) !== null && _l !== void 0 ? _l : now,
        created_by: (_m = input.created_by) !== null && _m !== void 0 ? _m : null,
        updated_by: (_o = input.updated_by) !== null && _o !== void 0 ? _o : null,
    };
}
function normalizeVersion(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId("tplv");
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        template_id: String((_c = input.template_id) !== null && _c !== void 0 ? _c : ""),
        version: typeof input.version === "number" ? input.version : 1,
        subject: (_d = input.subject) !== null && _d !== void 0 ? _d : null,
        body: String((_e = input.body) !== null && _e !== void 0 ? _e : ""),
        change_summary: (_f = input.change_summary) !== null && _f !== void 0 ? _f : null,
        is_current: input.is_current === true,
        created_at: (_g = input.created_at) !== null && _g !== void 0 ? _g : now,
        created_by: (_h = input.created_by) !== null && _h !== void 0 ? _h : null,
    };
}
export async function listTemplates(tenantId, filter) {
    const includeArchived = (filter === null || filter === void 0 ? void 0 : filter.includeArchived) === true;
    if (!templatesMissing()) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase
                .from(TEMPLATES_TABLE)
                .select("*")
                .eq("tenant_id", tenantId);
            if (filter === null || filter === void 0 ? void 0 : filter.category)
                query = query.eq("category", filter.category);
            if (filter === null || filter === void 0 ? void 0 : filter.channel)
                query = query.eq("channel", filter.channel);
            if (!includeArchived)
                query = query.eq("is_archived", false);
            const { data, error } = await query.order("updated_at", {
                ascending: false,
            });
            if (!error)
                return (data !== null && data !== void 0 ? data : []);
            if (isMissingTableError(error, "templates")) {
                markTemplatesMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, "templates")) {
                markTemplatesMissing();
            }
            else {
                throw err;
            }
        }
    }
    let rows = Array.from(templateStore().values()).filter((r) => r.tenant_id === tenantId);
    if (filter === null || filter === void 0 ? void 0 : filter.category)
        rows = rows.filter((r) => r.category === filter.category);
    if (filter === null || filter === void 0 ? void 0 : filter.channel)
        rows = rows.filter((r) => r.channel === filter.channel);
    if (!includeArchived)
        rows = rows.filter((r) => !r.is_archived);
    return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getTemplate(templateId, tenantId) {
    if (!templatesMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TEMPLATES_TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", templateId)
                .maybeSingle();
            if (!error)
                return (data !== null && data !== void 0 ? data : null);
            if (isMissingTableError(error, "templates")) {
                markTemplatesMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, "templates")) {
                markTemplatesMissing();
            }
            else {
                throw err;
            }
        }
    }
    const row = templateStore().get(templateId);
    if (!row)
        return null;
    if (row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertTemplate(tenantId, input) {
    const row = normalizeTemplate(Object.assign(Object.assign({}, input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!templatesMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TEMPLATES_TABLE)
                .upsert(row, { onConflict: "id" })
                .select("*")
                .single();
            if (!error && data)
                return data;
            if (error && isMissingTableError(error, "templates")) {
                markTemplatesMissing();
            }
            else if (error) {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, "templates")) {
                markTemplatesMissing();
            }
            else {
                throw err;
            }
        }
    }
    templateStore().set(row.id, row);
    return row;
}
export async function deleteTemplate(templateId, tenantId) {
    if (!templatesMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TEMPLATES_TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("id", templateId);
            if (!error)
                return;
            if (isMissingTableError(error, "templates")) {
                markTemplatesMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, "templates")) {
                markTemplatesMissing();
            }
            else {
                throw err;
            }
        }
    }
    const row = templateStore().get(templateId);
    if (row && row.tenant_id === tenantId) {
        templateStore().delete(templateId);
    }
}
export async function listTemplateVersions(templateId, tenantId) {
    if (!versionsMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TEMPLATE_VERSIONS_TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("template_id", templateId)
                .order("version", { ascending: false });
            if (!error)
                return (data !== null && data !== void 0 ? data : []);
            if (isMissingTableError(error, "template_versions")) {
                markVersionsMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, "template_versions")) {
                markVersionsMissing();
            }
            else {
                throw err;
            }
        }
    }
    const rows = Array.from(versionStore().values()).filter((r) => r.tenant_id === tenantId && r.template_id === templateId);
    return rows.sort((a, b) => b.version - a.version);
}
export async function getTemplateVersion(versionId, tenantId) {
    if (!versionsMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TEMPLATE_VERSIONS_TABLE)
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", versionId)
                .maybeSingle();
            if (!error)
                return (data !== null && data !== void 0 ? data : null);
            if (isMissingTableError(error, "template_versions")) {
                markVersionsMissing();
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, "template_versions")) {
                markVersionsMissing();
            }
            else {
                throw err;
            }
        }
    }
    const row = versionStore().get(versionId);
    if (!row)
        return null;
    if (row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertTemplateVersion(tenantId, input) {
    const row = normalizeVersion(Object.assign(Object.assign({}, input), { tenant_id: tenantId }));
    if (!versionsMissing()) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TEMPLATE_VERSIONS_TABLE)
                .upsert(row, { onConflict: "id" })
                .select("*")
                .single();
            if (!error && data)
                return data;
            if (error && isMissingTableError(error, "template_versions")) {
                markVersionsMissing();
            }
            else if (error) {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, "template_versions")) {
                markVersionsMissing();
            }
            else {
                throw err;
            }
        }
    }
    versionStore().set(row.id, row);
    return row;
}
export async function markVersionCurrent(templateId, versionId, tenantId) {
    const versions = await listTemplateVersions(templateId, tenantId);
    for (const v of versions) {
        const shouldBeCurrent = v.id === versionId;
        if (v.is_current !== shouldBeCurrent) {
            await upsertTemplateVersion(tenantId, Object.assign(Object.assign({}, v), { is_current: shouldBeCurrent }));
        }
    }
}
