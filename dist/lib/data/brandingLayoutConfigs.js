import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
const TABLE = "branding_layout_configs";
const g = globalThis;
function store() {
    if (!g.__ziro_branding_layouts_store)
        g.__ziro_branding_layouts_store = new Map();
    return g.__ziro_branding_layouts_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `lay_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function defaultWidgets(scope) {
    switch (scope) {
        case "student":
            return [
                { id: "next-lesson", title: "Next lesson", size: "md" },
                { id: "assignments", title: "Assignments", size: "md" },
                { id: "progress", title: "Progress", size: "lg" },
                { id: "messages", title: "Messages", size: "sm" },
            ];
        case "family":
            return [
                { id: "students", title: "Students", size: "md" },
                { id: "schedule", title: "Schedule", size: "md" },
                { id: "billing", title: "Billing", size: "md" },
                { id: "messages", title: "Messages", size: "sm" },
            ];
        case "teacher":
            return [
                { id: "today", title: "Today's lessons", size: "lg" },
                { id: "roster", title: "Roster", size: "md" },
                { id: "followups", title: "Follow-ups", size: "md" },
                { id: "inbox", title: "Inbox", size: "sm" },
            ];
        case "director":
            return [
                { id: "kpis", title: "KPIs", size: "lg" },
                { id: "enrollments", title: "Enrollments", size: "md" },
                { id: "revenue", title: "Revenue", size: "md" },
                { id: "schedule-heat", title: "Schedule heat", size: "lg" },
            ];
        case "admin":
            return [
                { id: "tenant-health", title: "Tenant health", size: "lg" },
                { id: "users", title: "Users & roles", size: "md" },
                { id: "audit", title: "Audit", size: "md" },
                { id: "branding", title: "Branding", size: "sm" },
            ];
    }
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    const scope = ((_b = input.scope) !== null && _b !== void 0 ? _b : "teacher");
    return {
        id,
        tenant_id: String((_c = input.tenant_id) !== null && _c !== void 0 ? _c : ""),
        scope,
        preset: ((_d = input.preset) !== null && _d !== void 0 ? _d : "classic"),
        sidebar_variant: ((_e = input.sidebar_variant) !== null && _e !== void 0 ? _e : "icons_labels"),
        dashboard_preset: ((_f = input.dashboard_preset) !== null && _f !== void 0 ? _f : "grid"),
        widgets: Array.isArray(input.widgets) && input.widgets.length > 0
            ? input.widgets
            : defaultWidgets(scope),
        header_extras: Array.isArray(input.header_extras) ? input.header_extras : [],
        footer_extras: Array.isArray(input.footer_extras) ? input.footer_extras : [],
        created_at: (_g = input.created_at) !== null && _g !== void 0 ? _g : now,
        updated_at: (_h = input.updated_at) !== null && _h !== void 0 ? _h : now,
    };
}
export const PORTAL_SCOPES = [
    "student",
    "family",
    "teacher",
    "director",
    "admin",
];
export async function listBrandingLayouts(tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 100,
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
        .sort((a, b) => a.scope.localeCompare(b.scope));
}
export async function getBrandingLayout(scope, tenantId) {
    var _a;
    const rows = await listBrandingLayouts(tenantId);
    return (_a = rows.find((r) => r.scope === scope)) !== null && _a !== void 0 ? _a : null;
}
export async function upsertBrandingLayout(tenantId, input) {
    const existing = await getBrandingLayout(input.scope, tenantId);
    const row = normalizeRow(Object.assign(Object.assign(Object.assign({}, (existing !== null && existing !== void 0 ? existing : {})), input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "tenant_id,scope" })
                .select("*")
                .single();
            if (!error && data) {
                store().set(row.id, data);
                return data;
            }
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
export async function deleteBrandingLayout(id, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("id", id)
                .eq("tenant_id", tenantId);
            if (!error) {
                store().delete(id);
                return true;
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
    const existing = store().get(id);
    if (existing && existing.tenant_id === tenantId) {
        store().delete(id);
        return true;
    }
    return false;
}
