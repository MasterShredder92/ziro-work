import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
/** Table `branding_profiles` — suggested indexes: `(tenant_id)`, `(tenant_id, updated_at DESC)`, `(theme_key)` when stored. */
const TABLE = "branding_profiles";
const g = globalThis;
function store() {
    if (!g.__ziro_branding_profiles_store)
        g.__ziro_branding_profiles_store = new Map();
    return g.__ziro_branding_profiles_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `brand_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
export const DEFAULT_COLORS = {
    primary: "#00ff88",
    secondary: "#00cc6e",
    accent: "#00ff88",
    background: "#080808",
    surface: "#101012",
    danger: "#ff3b6b",
    warning: "#ffcc33",
    success: "#00ff88",
};
export const DEFAULT_TYPOGRAPHY = {
    headingFamily: "Inter, system-ui, sans-serif",
    bodyFamily: "Inter, system-ui, sans-serif",
    monoFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    baseSizePx: 16,
    headingScale: 1.125,
    lineHeight: 1.5,
    letterSpacing: -0.01,
};
export const DEFAULT_COMPONENT_TOKENS = {
    buttonRadius: "0.75rem",
    buttonShadow: null,
    cardRadius: "1rem",
    cardBorder: "#1c1c1e",
    navBackground: "#101012",
    navForeground: "#d4d4d4",
    sidebarBackground: "#0b0b0d",
    sidebarForeground: "#d4d4d4",
};
export const DEFAULT_LOGO = {
    light: null,
    dark: null,
    monochrome: null,
    width: null,
    height: null,
};
export const DEFAULT_ICONS = {
    favicon: null,
    appIcon192: null,
    appIcon512: null,
    touchIcon: null,
};
export const DEFAULT_HEADER_FOOTER = {
    headerTagline: null,
    footerText: null,
    footerLinks: [],
    supportEmail: null,
    supportUrl: null,
};
export const DEFAULT_LOGIN_PAGE = {
    heroImage: null,
    heroHeadline: null,
    heroSubline: null,
    backgroundColor: null,
    accentColor: null,
};
export const DEFAULT_PDF_EXPORT = {
    logo: null,
    footerText: null,
    watermark: null,
    pageNumbers: true,
};
export const DEFAULT_PUBLIC_PAGES = {
    showPoweredBy: true,
    shareHeaderText: null,
    signatureFooterText: null,
};
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        name: String((_c = input.name) !== null && _c !== void 0 ? _c : "Default brand"),
        status: ((_d = input.status) !== null && _d !== void 0 ? _d : "draft"),
        theme_key: (_e = input.theme_key) !== null && _e !== void 0 ? _e : null,
        colors: Object.assign(Object.assign({}, DEFAULT_COLORS), ((_f = input.colors) !== null && _f !== void 0 ? _f : {})),
        typography: Object.assign(Object.assign({}, DEFAULT_TYPOGRAPHY), ((_g = input.typography) !== null && _g !== void 0 ? _g : {})),
        components: Object.assign(Object.assign({}, DEFAULT_COMPONENT_TOKENS), ((_h = input.components) !== null && _h !== void 0 ? _h : {})),
        logo: Object.assign(Object.assign({}, DEFAULT_LOGO), ((_j = input.logo) !== null && _j !== void 0 ? _j : {})),
        icons: Object.assign(Object.assign({}, DEFAULT_ICONS), ((_k = input.icons) !== null && _k !== void 0 ? _k : {})),
        header_footer: Object.assign(Object.assign({}, DEFAULT_HEADER_FOOTER), ((_l = input.header_footer) !== null && _l !== void 0 ? _l : {})),
        login_page: Object.assign(Object.assign({}, DEFAULT_LOGIN_PAGE), ((_m = input.login_page) !== null && _m !== void 0 ? _m : {})),
        pdf_export: Object.assign(Object.assign({}, DEFAULT_PDF_EXPORT), ((_o = input.pdf_export) !== null && _o !== void 0 ? _o : {})),
        public_pages: Object.assign(Object.assign({}, DEFAULT_PUBLIC_PAGES), ((_p = input.public_pages) !== null && _p !== void 0 ? _p : {})),
        draft: (_q = input.draft) !== null && _q !== void 0 ? _q : null,
        published_at: (_r = input.published_at) !== null && _r !== void 0 ? _r : null,
        published_by: (_s = input.published_by) !== null && _s !== void 0 ? _s : null,
        created_at: (_t = input.created_at) !== null && _t !== void 0 ? _t : now,
        updated_at: (_u = input.updated_at) !== null && _u !== void 0 ? _u : now,
    };
}
export async function listBrandingProfiles(tenantId, opts) {
    var _a, _b, _c;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 50,
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
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function getBrandingProfile(tenantId) {
    var _a;
    const rows = await listBrandingProfiles(tenantId, { limit: 1 });
    return (_a = rows[0]) !== null && _a !== void 0 ? _a : null;
}
export async function getBrandingProfileById(id, tenantId) {
    var _a;
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            let query = supabase.from(TABLE).select("*").eq("id", id);
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
    const row = (_a = store().get(id)) !== null && _a !== void 0 ? _a : null;
    if (!row)
        return null;
    if (tenantId && row.tenant_id !== tenantId)
        return null;
    return row;
}
export async function upsertBrandingProfile(tenantId, input) {
    const existing = input.id
        ? await getBrandingProfileById(input.id, tenantId)
        : await getBrandingProfile(tenantId);
    const row = normalizeRow(Object.assign(Object.assign(Object.assign({}, (existing !== null && existing !== void 0 ? existing : {})), input), { tenant_id: tenantId, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "id" })
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
export async function deleteBrandingProfile(id, tenantId) {
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
