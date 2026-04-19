import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

/** Table `branding_profiles` — suggested indexes: `(tenant_id)`, `(tenant_id, updated_at DESC)`, `(theme_key)` when stored. */
const TABLE = "branding_profiles";

export type BrandingProfileStatus = "draft" | "published" | "archived";

export type BrandingColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  danger?: string | null;
  warning?: string | null;
  success?: string | null;
};

export type BrandingTypography = {
  headingFamily: string;
  bodyFamily: string;
  monoFamily?: string | null;
  baseSizePx: number;
  headingScale: number;
  lineHeight: number;
  letterSpacing?: number | null;
};

export type BrandingComponentTokens = {
  buttonRadius: string;
  buttonShadow?: string | null;
  cardRadius: string;
  cardBorder?: string | null;
  navBackground?: string | null;
  navForeground?: string | null;
  sidebarBackground?: string | null;
  sidebarForeground?: string | null;
};

export type BrandingLogo = {
  light: string | null;
  dark: string | null;
  monochrome?: string | null;
  width?: number | null;
  height?: number | null;
};

export type BrandingIcons = {
  favicon: string | null;
  appIcon192: string | null;
  appIcon512: string | null;
  touchIcon?: string | null;
};

export type BrandingHeaderFooter = {
  headerTagline?: string | null;
  footerText?: string | null;
  footerLinks?: Array<{ label: string; href: string }>;
  supportEmail?: string | null;
  supportUrl?: string | null;
};

export type BrandingLoginPage = {
  heroImage?: string | null;
  heroHeadline?: string | null;
  heroSubline?: string | null;
  backgroundColor?: string | null;
  accentColor?: string | null;
};

export type BrandingPdfExport = {
  logo: string | null;
  footerText?: string | null;
  watermark?: string | null;
  pageNumbers: boolean;
};

export type BrandingPublicPages = {
  showPoweredBy: boolean;
  shareHeaderText?: string | null;
  signatureFooterText?: string | null;
};

export type BrandingDraftPayload = {
  colors?: Partial<BrandingColorPalette>;
  typography?: Partial<BrandingTypography>;
  components?: Partial<BrandingComponentTokens>;
  logo?: Partial<BrandingLogo>;
  icons?: Partial<BrandingIcons>;
  header_footer?: Partial<BrandingHeaderFooter>;
  login_page?: Partial<BrandingLoginPage>;
  pdf_export?: Partial<BrandingPdfExport>;
  public_pages?: Partial<BrandingPublicPages>;
};

export type BrandingProfileRow = {
  id: string;
  tenant_id: string;
  name: string;
  status: BrandingProfileStatus;
  theme_key: string | null;
  colors: BrandingColorPalette;
  typography: BrandingTypography;
  components: BrandingComponentTokens;
  logo: BrandingLogo;
  icons: BrandingIcons;
  header_footer: BrandingHeaderFooter;
  login_page: BrandingLoginPage;
  pdf_export: BrandingPdfExport;
  public_pages: BrandingPublicPages;
  draft: BrandingDraftPayload | null;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_branding_profiles_store?: Map<string, BrandingProfileRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, BrandingProfileRow> {
  if (!g.__ziro_branding_profiles_store) g.__ziro_branding_profiles_store = new Map();
  return g.__ziro_branding_profiles_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `brand_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export const DEFAULT_COLORS: BrandingColorPalette = {
  primary: "#00ff88",
  secondary: "#00cc6e",
  accent: "#00ff88",
  background: "#080808",
  surface: "#101012",
  danger: "#ff3b6b",
  warning: "#ffcc33",
  success: "#00ff88",
};

export const DEFAULT_TYPOGRAPHY: BrandingTypography = {
  headingFamily: "Inter, system-ui, sans-serif",
  bodyFamily: "Inter, system-ui, sans-serif",
  monoFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  baseSizePx: 16,
  headingScale: 1.125,
  lineHeight: 1.5,
  letterSpacing: -0.01,
};

export const DEFAULT_COMPONENT_TOKENS: BrandingComponentTokens = {
  buttonRadius: "0.75rem",
  buttonShadow: null,
  cardRadius: "1rem",
  cardBorder: "#1c1c1e",
  navBackground: "#101012",
  navForeground: "#d4d4d4",
  sidebarBackground: "#0b0b0d",
  sidebarForeground: "#d4d4d4",
};

export const DEFAULT_LOGO: BrandingLogo = {
  light: null,
  dark: null,
  monochrome: null,
  width: null,
  height: null,
};

export const DEFAULT_ICONS: BrandingIcons = {
  favicon: null,
  appIcon192: null,
  appIcon512: null,
  touchIcon: null,
};

export const DEFAULT_HEADER_FOOTER: BrandingHeaderFooter = {
  headerTagline: null,
  footerText: null,
  footerLinks: [],
  supportEmail: null,
  supportUrl: null,
};

export const DEFAULT_LOGIN_PAGE: BrandingLoginPage = {
  heroImage: null,
  heroHeadline: null,
  heroSubline: null,
  backgroundColor: null,
  accentColor: null,
};

export const DEFAULT_PDF_EXPORT: BrandingPdfExport = {
  logo: null,
  footerText: null,
  watermark: null,
  pageNumbers: true,
};

export const DEFAULT_PUBLIC_PAGES: BrandingPublicPages = {
  showPoweredBy: true,
  shareHeaderText: null,
  signatureFooterText: null,
};

function normalizeRow(input: Partial<BrandingProfileRow>): BrandingProfileRow {
  const id = input.id ?? newId();
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    name: String(input.name ?? "Default brand"),
    status: (input.status ?? "draft") as BrandingProfileStatus,
    theme_key: input.theme_key ?? null,
    colors: { ...DEFAULT_COLORS, ...(input.colors ?? {}) },
    typography: { ...DEFAULT_TYPOGRAPHY, ...(input.typography ?? {}) },
    components: { ...DEFAULT_COMPONENT_TOKENS, ...(input.components ?? {}) },
    logo: { ...DEFAULT_LOGO, ...(input.logo ?? {}) },
    icons: { ...DEFAULT_ICONS, ...(input.icons ?? {}) },
    header_footer: { ...DEFAULT_HEADER_FOOTER, ...(input.header_footer ?? {}) },
    login_page: { ...DEFAULT_LOGIN_PAGE, ...(input.login_page ?? {}) },
    pdf_export: { ...DEFAULT_PDF_EXPORT, ...(input.pdf_export ?? {}) },
    public_pages: { ...DEFAULT_PUBLIC_PAGES, ...(input.public_pages ?? {}) },
    draft: input.draft ?? null,
    published_at: input.published_at ?? null,
    published_by: input.published_by ?? null,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export async function listBrandingProfiles(
  tenantId: string,
  opts?: ListOptions,
): Promise<BrandingProfileRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 50,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as BrandingProfileRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getBrandingProfile(
  tenantId: string,
): Promise<BrandingProfileRow | null> {
  const rows = await listBrandingProfiles(tenantId, { limit: 1 });
  return rows[0] ?? null;
}

export async function getBrandingProfileById(
  id: string,
  tenantId?: string,
): Promise<BrandingProfileRow | null> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase.from(TABLE).select("*").eq("id", id);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      const { data, error } = await query.maybeSingle();
      if (!error) return (data ?? null) as BrandingProfileRow | null;
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const row = store().get(id) ?? null;
  if (!row) return null;
  if (tenantId && row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertBrandingProfile(
  tenantId: string,
  input: Partial<BrandingProfileRow>,
): Promise<BrandingProfileRow> {
  const existing = input.id
    ? await getBrandingProfileById(input.id, tenantId)
    : await getBrandingProfile(tenantId);

  const row = normalizeRow({
    ...(existing ?? {}),
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) {
        store().set(row.id, data as BrandingProfileRow);
        return data as BrandingProfileRow;
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

export async function deleteBrandingProfile(
  id: string,
  tenantId: string,
): Promise<boolean> {
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
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (existing && existing.tenant_id === tenantId) {
    store().delete(id);
    return true;
  }
  return false;
}
