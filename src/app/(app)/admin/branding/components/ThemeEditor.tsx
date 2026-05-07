"use client";

import { useMemo, useState, useTransition } from "react";
import type { BrandingPreviewDevice } from "@/components/branding/previewDevice";
import { PortalPreview } from "@/components/branding/PortalPreview";
import { PreviewDeviceSegmentedControl } from "@/components/branding/PreviewDeviceSegmentedControl";
import { PreviewSurfaceModeControl } from "@/components/branding/PreviewSurfaceModeControl";
import type {
  BrandingColorPalette,
  BrandingComponentTokens,
  BrandingHeaderFooter,
  BrandingIcons,
  BrandingLoginPage,
  BrandingLogo,
  BrandingPdfExport,
  BrandingProfile,
  BrandingPublicPages,
  BrandingTypography,
  ThemePreset,
} from "@/lib/branding";
import {
  brandingCssVars,
  serializeCssVars,
} from "@/lib/branding/runtime";
import { ColorPicker } from "./ColorPicker";
import { LogoUploader } from "./LogoUploader";
import { FaviconUploader } from "./FaviconUploader";
import { ThemePreviewCard } from "./ThemePreviewCard";
import { BrandingPreview } from "./BrandingPreview";

type DraftState = {
  name: string;
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
};

function toDraft(profile: BrandingProfile | null): DraftState {
  return {
    name: profile?.name ?? "Default brand",
    theme_key: profile?.theme_key ?? null,
    colors: profile?.colors ?? {
      primary: "#c4f036",
      secondary: "#9ec42a",
      accent: "#c4f036",
      background: "#080808",
      surface: "#101012",
    },
    typography: profile?.typography ?? {
      headingFamily: "Inter, system-ui, sans-serif",
      bodyFamily: "Inter, system-ui, sans-serif",
      baseSizePx: 16,
      headingScale: 1.125,
      lineHeight: 1.5,
    },
    components: profile?.components ?? {
      buttonRadius: "0.75rem",
      cardRadius: "1rem",
    },
    logo: profile?.logo ?? {
      light: null,
      dark: null,
      monochrome: null,
    },
    icons: profile?.icons ?? {
      favicon: null,
      appIcon192: null,
      appIcon512: null,
    },
    header_footer: profile?.header_footer ?? { footerLinks: [] },
    login_page: profile?.login_page ?? {},
    pdf_export: profile?.pdf_export ?? { logo: null, pageNumbers: true },
    public_pages: profile?.public_pages ?? { showPoweredBy: true },
  };
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold text-[var(--z-fg)]">{title}</div>
        {description ? (
          <div className="text-[11px] text-[var(--z-muted)] mt-0.5">
            {description}
          </div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ThemeEditor({
  tenantId,
  profile,
  themes,
  canWrite,
}: {
  tenantId: string;
  profile: BrandingProfile | null;
  themes: ThemePreset[];
  canWrite: boolean;
}) {
  const [draft, setDraft] = useState<DraftState>(() => toDraft(profile));
  const [previewDevice, setPreviewDevice] =
    useState<BrandingPreviewDevice>("desktop");
  const [previewSurface, setPreviewSurface] = useState<"theme" | "portal">(
    "theme",
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const patchColors = (patch: Partial<BrandingColorPalette>) =>
    setDraft((d) => ({ ...d, colors: { ...d.colors, ...patch } }));
  const patchTypography = (patch: Partial<BrandingTypography>) =>
    setDraft((d) => ({ ...d, typography: { ...d.typography, ...patch } }));
  const patchComponents = (patch: Partial<BrandingComponentTokens>) =>
    setDraft((d) => ({ ...d, components: { ...d.components, ...patch } }));
  const patchLogo = (patch: Partial<BrandingLogo>) =>
    setDraft((d) => ({ ...d, logo: { ...d.logo, ...patch } }));
  const patchIcons = (patch: Partial<BrandingIcons>) =>
    setDraft((d) => ({ ...d, icons: { ...d.icons, ...patch } }));
  const patchHeaderFooter = (patch: Partial<BrandingHeaderFooter>) =>
    setDraft((d) => ({
      ...d,
      header_footer: { ...d.header_footer, ...patch },
    }));
  const patchLoginPage = (patch: Partial<BrandingLoginPage>) =>
    setDraft((d) => ({ ...d, login_page: { ...d.login_page, ...patch } }));
  const patchPdf = (patch: Partial<BrandingPdfExport>) =>
    setDraft((d) => ({ ...d, pdf_export: { ...d.pdf_export, ...patch } }));
  const patchPublic = (patch: Partial<BrandingPublicPages>) =>
    setDraft((d) => ({ ...d, public_pages: { ...d.public_pages, ...patch } }));

  const applyTheme = (themeKey: string) => {
    const theme = themes.find((t) => t.theme_key === themeKey);
    if (!theme) return;
    setDraft((d) => ({
      ...d,
      theme_key: theme.theme_key,
      colors: { ...d.colors, ...theme.tokens.colors },
      typography: { ...d.typography, ...theme.tokens.typography },
      components: { ...d.components, ...theme.tokens.components },
    }));
  };

  const previewCss = useMemo(() => {
    const vars = brandingCssVars({
      ...(profile ?? ({} as BrandingProfile)),
      ...draft,
      id: profile?.id ?? "preview",
      tenant_id: tenantId,
      name: draft.name,
      status: "draft",
      theme_key: draft.theme_key,
      draft: null,
      published_at: null,
      published_by: null,
      created_at: profile?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return serializeCssVars(vars, "[data-branding-preview]");
  }, [draft, profile, tenantId]);

  const save = (opts?: { publish?: boolean }) => {
    if (!canWrite) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/branding/profile?tenantId=${encodeURIComponent(tenantId)}`,
          {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
              "x-tenant-id": tenantId,
            },
            body: JSON.stringify({
              patch: {
                id: profile?.id,
                name: draft.name,
                theme_key: draft.theme_key,
                colors: draft.colors,
                typography: draft.typography,
                components: draft.components,
                logo: draft.logo,
                icons: draft.icons,
                header_footer: draft.header_footer,
                login_page: draft.login_page,
                pdf_export: draft.pdf_export,
                public_pages: draft.public_pages,
                status: opts?.publish ? "published" : "draft",
                published_at: opts?.publish
                  ? new Date().toISOString()
                  : (profile?.published_at ?? null),
              },
            }),
          },
        );
        const json = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        if (!res.ok) {
          setError(json?.error ?? `HTTP ${res.status}`);
          return;
        }
        setSavedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Theme editor
          </div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            Colors, typography & component tokens
          </h1>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {savedAt ? (
            <span className="text-[11px] text-[var(--z-muted)]">
              Saved {new Date(savedAt).toLocaleTimeString()}
            </span>
          ) : null}
          <button
            type="button"
            disabled={!canWrite || isPending}
            onClick={() => save({ publish: false })}
            className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={!canWrite || isPending}
            onClick={() => save({ publish: true })}
            className="h-9 rounded-[var(--z-radius-sm)] border border-[#c4f036]/40 bg-[#c4f036]/10 px-3 text-xs font-semibold text-[#c4f036] hover:bg-[#c4f036]/20 disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Brand name" description="Workspace-level display name.">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              disabled={!canWrite}
              className="h-9 w-full rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
            />
          </Section>

          <Section title="Theme presets" description="Pick a preset and customise below.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {themes.map((t) => (
                <ThemePreviewCard
                  key={t.theme_key}
                  theme={t}
                  active={draft.theme_key === t.theme_key}
                  onSelect={applyTheme}
                />
              ))}
            </div>
          </Section>

          <Section title="Color palette">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ColorPicker
                label="Primary"
                value={draft.colors.primary}
                onChange={(v) => patchColors({ primary: v })}
                disabled={!canWrite}
              />
              <ColorPicker
                label="Secondary"
                value={draft.colors.secondary}
                onChange={(v) => patchColors({ secondary: v })}
                disabled={!canWrite}
              />
              <ColorPicker
                label="Accent"
                value={draft.colors.accent}
                onChange={(v) => patchColors({ accent: v })}
                disabled={!canWrite}
              />
              <ColorPicker
                label="Background"
                value={draft.colors.background}
                onChange={(v) => patchColors({ background: v })}
                disabled={!canWrite}
              />
              <ColorPicker
                label="Surface"
                value={draft.colors.surface}
                onChange={(v) => patchColors({ surface: v })}
                disabled={!canWrite}
              />
              <ColorPicker
                label="Danger"
                value={draft.colors.danger ?? "#ff3b6b"}
                onChange={(v) => patchColors({ danger: v })}
                disabled={!canWrite}
              />
            </div>
          </Section>

          <Section title="Typography">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Heading family
                </span>
                <input
                  type="text"
                  value={draft.typography.headingFamily}
                  onChange={(e) =>
                    patchTypography({ headingFamily: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Body family
                </span>
                <input
                  type="text"
                  value={draft.typography.bodyFamily}
                  onChange={(e) =>
                    patchTypography({ bodyFamily: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Base size (px)
                </span>
                <input
                  type="number"
                  value={draft.typography.baseSizePx}
                  onChange={(e) =>
                    patchTypography({
                      baseSizePx: Number(e.target.value) || 16,
                    })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Heading scale
                </span>
                <input
                  type="number"
                  step="0.05"
                  value={draft.typography.headingScale}
                  onChange={(e) =>
                    patchTypography({
                      headingScale: Number(e.target.value) || 1.125,
                    })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
            </div>
          </Section>

          <Section title="Component tokens">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Button radius
                </span>
                <input
                  type="text"
                  value={draft.components.buttonRadius}
                  onChange={(e) =>
                    patchComponents({ buttonRadius: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Card radius
                </span>
                <input
                  type="text"
                  value={draft.components.cardRadius}
                  onChange={(e) =>
                    patchComponents({ cardRadius: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono"
                />
              </label>
              <ColorPicker
                label="Nav background"
                value={draft.components.navBackground ?? "#101012"}
                onChange={(v) => patchComponents({ navBackground: v })}
                disabled={!canWrite}
              />
              <ColorPicker
                label="Sidebar background"
                value={draft.components.sidebarBackground ?? "#0b0b0d"}
                onChange={(v) => patchComponents({ sidebarBackground: v })}
                disabled={!canWrite}
              />
            </div>
          </Section>

          <Section title="Logos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <LogoUploader
                label="Logo (dark bg)"
                value={draft.logo.dark ?? null}
                onChange={(v) => patchLogo({ dark: v })}
                disabled={!canWrite}
                backgroundStyle="dark"
              />
              <LogoUploader
                label="Logo (light bg)"
                value={draft.logo.light ?? null}
                onChange={(v) => patchLogo({ light: v })}
                disabled={!canWrite}
                backgroundStyle="light"
              />
              <LogoUploader
                label="Monochrome"
                value={draft.logo.monochrome ?? null}
                onChange={(v) => patchLogo({ monochrome: v })}
                disabled={!canWrite}
                backgroundStyle="dark"
              />
            </div>
          </Section>

          <Section title="Icons">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <FaviconUploader
                size="favicon"
                value={draft.icons.favicon}
                onChange={(v) => patchIcons({ favicon: v })}
                disabled={!canWrite}
              />
              <FaviconUploader
                size="icon192"
                label="App icon 192"
                value={draft.icons.appIcon192}
                onChange={(v) => patchIcons({ appIcon192: v })}
                disabled={!canWrite}
              />
              <FaviconUploader
                size="icon512"
                label="App icon 512"
                value={draft.icons.appIcon512}
                onChange={(v) => patchIcons({ appIcon512: v })}
                disabled={!canWrite}
              />
            </div>
          </Section>

          <Section title="Header & footer">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Header tagline
                </span>
                <input
                  type="text"
                  value={draft.header_footer.headerTagline ?? ""}
                  onChange={(e) =>
                    patchHeaderFooter({ headerTagline: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Footer text
                </span>
                <input
                  type="text"
                  value={draft.header_footer.footerText ?? ""}
                  onChange={(e) =>
                    patchHeaderFooter({ footerText: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Support email
                </span>
                <input
                  type="email"
                  value={draft.header_footer.supportEmail ?? ""}
                  onChange={(e) =>
                    patchHeaderFooter({ supportEmail: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Support URL
                </span>
                <input
                  type="url"
                  value={draft.header_footer.supportUrl ?? ""}
                  onChange={(e) =>
                    patchHeaderFooter({ supportUrl: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
            </div>
          </Section>

          <Section title="Login page">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Hero headline
                </span>
                <input
                  type="text"
                  value={draft.login_page.heroHeadline ?? ""}
                  onChange={(e) =>
                    patchLoginPage({ heroHeadline: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Hero subline
                </span>
                <input
                  type="text"
                  value={draft.login_page.heroSubline ?? ""}
                  onChange={(e) =>
                    patchLoginPage({ heroSubline: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <LogoUploader
                label="Hero image"
                value={draft.login_page.heroImage ?? null}
                onChange={(v) => patchLoginPage({ heroImage: v })}
                disabled={!canWrite}
              />
              <ColorPicker
                label="Hero background"
                value={draft.login_page.backgroundColor ?? draft.colors.background}
                onChange={(v) => patchLoginPage({ backgroundColor: v })}
                disabled={!canWrite}
              />
            </div>
          </Section>

          <Section title="PDF export branding">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <LogoUploader
                label="PDF logo"
                value={draft.pdf_export.logo ?? null}
                onChange={(v) => patchPdf({ logo: v })}
                disabled={!canWrite}
              />
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Footer text
                </span>
                <input
                  type="text"
                  value={draft.pdf_export.footerText ?? ""}
                  onChange={(e) =>
                    patchPdf({ footerText: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Watermark
                </span>
                <input
                  type="text"
                  value={draft.pdf_export.watermark ?? ""}
                  onChange={(e) =>
                    patchPdf({ watermark: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={draft.pdf_export.pageNumbers}
                  onChange={(e) => patchPdf({ pageNumbers: e.target.checked })}
                  disabled={!canWrite}
                />
                <span className="text-sm text-[var(--z-fg)]">Show page numbers</span>
              </label>
            </div>
          </Section>

          <Section title="Public pages">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft.public_pages.showPoweredBy}
                  onChange={(e) =>
                    patchPublic({ showPoweredBy: e.target.checked })
                  }
                  disabled={!canWrite}
                />
                <span className="text-sm text-[var(--z-fg)]">Show “Powered by” badge</span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Share header text
                </span>
                <input
                  type="text"
                  value={draft.public_pages.shareHeaderText ?? ""}
                  onChange={(e) =>
                    patchPublic({ shareHeaderText: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
                  Signature footer text
                </span>
                <input
                  type="text"
                  value={draft.public_pages.signatureFooterText ?? ""}
                  onChange={(e) =>
                    patchPublic({ signatureFooterText: e.target.value })
                  }
                  disabled={!canWrite}
                  className="h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]"
                />
              </label>
            </div>
          </Section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-2 lg:self-start">
          <Section
            title="Live preview"
            description="Reflects your draft as you edit — scoped to this panel only."
          >
            <style dangerouslySetInnerHTML={{ __html: previewCss }} />
            <div className="space-y-3">
              <PreviewSurfaceModeControl
                value={previewSurface}
                onChange={setPreviewSurface}
              />
              <PreviewDeviceSegmentedControl
                value={previewDevice}
                onChange={setPreviewDevice}
              />
              {previewSurface === "theme" ? (
                <BrandingPreview
                  device={previewDevice}
                  logo={draft.logo}
                  colors={draft.colors}
                  typography={draft.typography}
                  headerFooter={draft.header_footer}
                />
              ) : (
                <PortalPreview
                  device={previewDevice}
                  tenantName={draft.name}
                />
              )}
            </div>
          </Section>
        </aside>
      </div>
    </div>
  );
}
