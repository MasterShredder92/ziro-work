import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";
import type {
  BrandingColorPalette,
  BrandingComponentTokens,
  BrandingTypography,
} from "./brandingProfiles";
import {
  DEFAULT_COLORS,
  DEFAULT_COMPONENT_TOKENS,
  DEFAULT_TYPOGRAPHY,
} from "./brandingProfiles";

const TABLE = "branding_themes";

export type ThemePresetTokens = {
  colors: BrandingColorPalette;
  typography: BrandingTypography;
  components: BrandingComponentTokens;
};

export type BrandingThemeRow = {
  id: string;
  tenant_id: string;
  theme_key: string;
  name: string;
  description: string | null;
  tokens: ThemePresetTokens;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_branding_themes_store?: Map<string, BrandingThemeRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, BrandingThemeRow> {
  if (!g.__ziro_branding_themes_store) g.__ziro_branding_themes_store = new Map();
  return g.__ziro_branding_themes_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `thm_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeTokens(input?: Partial<ThemePresetTokens>): ThemePresetTokens {
  return {
    colors: { ...DEFAULT_COLORS, ...(input?.colors ?? {}) },
    typography: { ...DEFAULT_TYPOGRAPHY, ...(input?.typography ?? {}) },
    components: { ...DEFAULT_COMPONENT_TOKENS, ...(input?.components ?? {}) },
  };
}

function normalizeRow(input: Partial<BrandingThemeRow>): BrandingThemeRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    theme_key: String(input.theme_key ?? "custom"),
    name: String(input.name ?? "Custom theme"),
    description: input.description ?? null,
    tokens: normalizeTokens(input.tokens),
    is_system: input.is_system ?? false,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export const SYSTEM_THEMES: Array<
  Pick<BrandingThemeRow, "theme_key" | "name" | "description" | "tokens">
> = [
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
      components: {
        ...DEFAULT_COMPONENT_TOKENS,
        navBackground: "#11152a",
        sidebarBackground: "#0c1020",
      },
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
      components: {
        ...DEFAULT_COMPONENT_TOKENS,
        cardBorder: "#eee4d7",
        navBackground: "#ffffff",
        navForeground: "#1a1a1a",
        sidebarBackground: "#fff4e8",
        sidebarForeground: "#1a1a1a",
      },
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
      components: {
        ...DEFAULT_COMPONENT_TOKENS,
        cardBorder: "#13291f",
        navBackground: "#0d1b14",
        sidebarBackground: "#091812",
      },
    },
  },
];

export async function listBrandingThemes(
  tenantId: string,
  opts?: ListOptions,
): Promise<BrandingThemeRow[]> {
  let remote: BrandingThemeRow[] = [];
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 200,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) {
        remote = (data ?? []) as BrandingThemeRow[];
      } else if (isMissingTableError(error, TABLE)) {
        markTableMissing(TABLE);
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  const localThemes = Array.from(store().values()).filter(
    (r) => r.tenant_id === tenantId,
  );

  const systemThemes: BrandingThemeRow[] = SYSTEM_THEMES.map((t) => ({
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

  const byKey = new Map<string, BrandingThemeRow>();
  for (const t of systemThemes) byKey.set(t.theme_key, t);
  for (const t of [...remote, ...localThemes]) byKey.set(t.theme_key, t);
  return Array.from(byKey.values()).sort((a, b) =>
    a.is_system === b.is_system
      ? a.name.localeCompare(b.name)
      : a.is_system
        ? -1
        : 1,
  );
}

export async function getBrandingTheme(
  themeKey: string,
  tenantId: string,
): Promise<BrandingThemeRow | null> {
  const list = await listBrandingThemes(tenantId);
  return list.find((t) => t.theme_key === themeKey) ?? null;
}

export async function upsertBrandingTheme(
  tenantId: string,
  input: Partial<BrandingThemeRow> & { theme_key: string; name?: string },
): Promise<BrandingThemeRow> {
  const row = normalizeRow({
    ...input,
    tenant_id: tenantId,
    is_system: false,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "tenant_id,theme_key" })
        .select("*")
        .single();
      if (!error && data) {
        store().set(row.id, data as BrandingThemeRow);
        return data as BrandingThemeRow;
      }
      if (error && isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else if (error) throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  store().set(row.id, row);
  return row;
}

export async function deleteBrandingTheme(
  themeKey: string,
  tenantId: string,
): Promise<boolean> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = await clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("theme_key", themeKey);
      if (!error) return true;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
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
