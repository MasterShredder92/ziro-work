import { clientFor, applyListOptions } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing, } from "./_missingTable";
import { DEFAULT_COLORS, DEFAULT_COMPONENT_TOKENS, DEFAULT_TYPOGRAPHY, } from "./brandingProfiles";
const TABLE = "branding_themes";
const g = globalThis;
function store() {
    if (!g.__ziro_branding_themes_store)
        g.__ziro_branding_themes_store = new Map();
    return g.__ziro_branding_themes_store;
}
function nowIso() {
    return new Date().toISOString();
}
function newId() {
    return `thm_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function normalizeTokens(input) {
    var _a, _b, _c;
    return {
        colors: Object.assign(Object.assign({}, DEFAULT_COLORS), ((_a = input === null || input === void 0 ? void 0 : input.colors) !== null && _a !== void 0 ? _a : {})),
        typography: Object.assign(Object.assign({}, DEFAULT_TYPOGRAPHY), ((_b = input === null || input === void 0 ? void 0 : input.typography) !== null && _b !== void 0 ? _b : {})),
        components: Object.assign(Object.assign({}, DEFAULT_COMPONENT_TOKENS), ((_c = input === null || input === void 0 ? void 0 : input.components) !== null && _c !== void 0 ? _c : {})),
    };
}
function normalizeRow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const id = (_a = input.id) !== null && _a !== void 0 ? _a : newId();
    const now = nowIso();
    return {
        id,
        tenant_id: String((_b = input.tenant_id) !== null && _b !== void 0 ? _b : ""),
        theme_key: String((_c = input.theme_key) !== null && _c !== void 0 ? _c : "custom"),
        name: String((_d = input.name) !== null && _d !== void 0 ? _d : "Custom theme"),
        description: (_e = input.description) !== null && _e !== void 0 ? _e : null,
        tokens: normalizeTokens(input.tokens),
        is_system: (_f = input.is_system) !== null && _f !== void 0 ? _f : false,
        created_at: (_g = input.created_at) !== null && _g !== void 0 ? _g : now,
        updated_at: (_h = input.updated_at) !== null && _h !== void 0 ? _h : now,
    };
}
export const SYSTEM_THEMES = [
    {
        theme_key: "ziro-neon",
        name: "Ziro Neon",
        description: "Default dark theme with neon accent.",
        tokens: normalizeTokens(),
    },
    {
        theme_key: "midnight",
        name: "Midnight",
        description: "Cool dark blues with violet accent.",
        tokens: {
            colors: {
                primary: "#5b8cff",
                secondary: "#3658b3",
                accent: "#8a6cff",
                background: "#0a0d1a",
                surface: "#11152a",
                danger: "#ff5c7c",
                warning: "#ffc24a",
                success: "#3fd9a4",
            },
            typography: DEFAULT_TYPOGRAPHY,
            components: Object.assign(Object.assign({}, DEFAULT_COMPONENT_TOKENS), { navBackground: "#11152a", sidebarBackground: "#0c1020" }),
        },
    },
    {
        theme_key: "sunrise",
        name: "Sunrise",
        description: "Light theme with warm accent.",
        tokens: {
            colors: {
                primary: "#ff7a3c",
                secondary: "#ff9b63",
                accent: "#ff5a5f",
                background: "#fffaf4",
                surface: "#ffffff",
                danger: "#e03e5b",
                warning: "#d4a72c",
                success: "#22a06b",
            },
            typography: DEFAULT_TYPOGRAPHY,
            components: Object.assign(Object.assign({}, DEFAULT_COMPONENT_TOKENS), { cardBorder: "#eee4d7", navBackground: "#ffffff", navForeground: "#1a1a1a", sidebarBackground: "#fff4e8", sidebarForeground: "#1a1a1a" }),
        },
    },
    {
        theme_key: "forest",
        name: "Forest",
        description: "Deep green academic palette.",
        tokens: {
            colors: {
                primary: "#2f9e6b",
                secondary: "#1e6f4c",
                accent: "#f0b429",
                background: "#07120d",
                surface: "#0d1b14",
                danger: "#e85c6b",
                warning: "#f0b429",
                success: "#2f9e6b",
            },
            typography: DEFAULT_TYPOGRAPHY,
            components: Object.assign(Object.assign({}, DEFAULT_COMPONENT_TOKENS), { cardBorder: "#13291f", navBackground: "#0d1b14", sidebarBackground: "#091812" }),
        },
    },
];
export async function listBrandingThemes(tenantId, opts) {
    var _a, _b, _c;
    let remote = [];
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
            const ordered = applyListOptions(query, {
                orderBy: (_a = opts === null || opts === void 0 ? void 0 : opts.orderBy) !== null && _a !== void 0 ? _a : "updated_at",
                ascending: (_b = opts === null || opts === void 0 ? void 0 : opts.ascending) !== null && _b !== void 0 ? _b : false,
                limit: (_c = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _c !== void 0 ? _c : 200,
                offset: opts === null || opts === void 0 ? void 0 : opts.offset,
            });
            const { data, error } = await ordered;
            if (!error) {
                remote = (data !== null && data !== void 0 ? data : []);
            }
            else if (isMissingTableError(error, TABLE)) {
                markTableMissing(TABLE);
            }
            else {
                throw error;
            }
        }
        catch (err) {
            if (isMissingTableError(err, TABLE))
                markTableMissing(TABLE);
            else
                throw err;
        }
    }
    const localThemes = Array.from(store().values()).filter((r) => r.tenant_id === tenantId);
    const systemThemes = SYSTEM_THEMES.map((t) => ({
        id: `system-${t.theme_key}`,
        tenant_id: tenantId,
        theme_key: t.theme_key,
        name: t.name,
        description: t.description,
        tokens: t.tokens,
        is_system: true,
        created_at: "1970-01-01T00:00:00.000Z",
        updated_at: "1970-01-01T00:00:00.000Z",
    }));
    const byKey = new Map();
    for (const t of systemThemes)
        byKey.set(t.theme_key, t);
    for (const t of [...remote, ...localThemes])
        byKey.set(t.theme_key, t);
    return Array.from(byKey.values()).sort((a, b) => a.is_system === b.is_system
        ? a.name.localeCompare(b.name)
        : a.is_system
            ? -1
            : 1);
}
export async function getBrandingTheme(themeKey, tenantId) {
    var _a;
    const list = await listBrandingThemes(tenantId);
    return (_a = list.find((t) => t.theme_key === themeKey)) !== null && _a !== void 0 ? _a : null;
}
export async function upsertBrandingTheme(tenantId, input) {
    const row = normalizeRow(Object.assign(Object.assign({}, input), { tenant_id: tenantId, is_system: false, updated_at: nowIso() }));
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { data, error } = await supabase
                .from(TABLE)
                .upsert(row, { onConflict: "tenant_id,theme_key" })
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
export async function deleteBrandingTheme(themeKey, tenantId) {
    if (!tableMissing(TABLE)) {
        try {
            const supabase = clientFor(tenantId);
            const { error } = await supabase
                .from(TABLE)
                .delete()
                .eq("tenant_id", tenantId)
                .eq("theme_key", themeKey);
            if (!error)
                return true;
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
    for (const [id, row] of store().entries()) {
        if (row.tenant_id === tenantId && row.theme_key === themeKey) {
            store().delete(id);
            return true;
        }
    }
    return false;
}
