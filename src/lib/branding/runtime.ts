import type {
  BrandingColorPalette,
  BrandingComponentTokens,
  BrandingProfile,
  BrandingRuntime,
  BrandingTypography,
  CustomDomain,
  EmailIdentity,
  ThemePreset,
} from "./types";

export function paletteToCssVars(
  colors: BrandingColorPalette,
): Record<string, string> {
  const vars: Record<string, string> = {
    "--brand-primary": colors.primary,
    "--brand-secondary": colors.secondary,
    "--brand-accent": colors.accent,
    "--brand-background": colors.background,
    "--brand-surface": colors.surface,
    "--z-accent-color": colors.accent,
    "--z-accent": colors.accent,
    "--z-bg": colors.background,
    "--z-surface": colors.surface,
  };
  if (colors.danger) vars["--brand-danger"] = colors.danger;
  if (colors.warning) vars["--brand-warning"] = colors.warning;
  if (colors.success) vars["--brand-success"] = colors.success;
  return vars;
}

export function typographyToCssVars(
  typography: BrandingTypography,
): Record<string, string> {
  const vars: Record<string, string> = {
    "--brand-font-heading": typography.headingFamily,
    "--brand-font-body": typography.bodyFamily,
    "--brand-font-base-size": `${typography.baseSizePx}px`,
    "--brand-font-heading-scale": String(typography.headingScale),
    "--brand-font-line-height": String(typography.lineHeight),
    "--z-font-sans": typography.bodyFamily,
  };
  if (typography.monoFamily) vars["--brand-font-mono"] = typography.monoFamily;
  if (typography.letterSpacing != null) {
    vars["--brand-font-letter-spacing"] = `${typography.letterSpacing}em`;
  }
  return vars;
}

export function componentsToCssVars(
  components: BrandingComponentTokens,
): Record<string, string> {
  const vars: Record<string, string> = {
    "--brand-button-radius": components.buttonRadius,
    "--brand-card-radius": components.cardRadius,
    "--z-radius-md": components.buttonRadius,
    "--z-radius-lg": components.cardRadius,
  };
  if (components.buttonShadow) vars["--brand-button-shadow"] = components.buttonShadow;
  if (components.cardBorder) {
    vars["--brand-card-border"] = components.cardBorder;
    vars["--z-border"] = components.cardBorder;
  }
  if (components.navBackground) vars["--brand-nav-bg"] = components.navBackground;
  if (components.navForeground) vars["--brand-nav-fg"] = components.navForeground;
  if (components.sidebarBackground)
    vars["--brand-sidebar-bg"] = components.sidebarBackground;
  if (components.sidebarForeground)
    vars["--brand-sidebar-fg"] = components.sidebarForeground;
  return vars;
}

export function brandingCssVars(profile: BrandingProfile): Record<string, string> {
  return {
    ...paletteToCssVars(profile.colors),
    ...typographyToCssVars(profile.typography),
    ...componentsToCssVars(profile.components),
  };
}

export function serializeCssVars(
  vars: Record<string, string>,
  selector = ":root",
): string {
  const body = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `${selector} {\n${body}\n}`;
}

export function previewCssFromTheme(preset: ThemePreset): string {
  const vars = {
    ...paletteToCssVars(preset.tokens.colors),
    ...typographyToCssVars(preset.tokens.typography),
    ...componentsToCssVars(preset.tokens.components),
  };
  return serializeCssVars(vars);
}

export function buildBrandingRuntime(input: {
  tenantId: string;
  profile: BrandingProfile | null;
  emailIdentity?: EmailIdentity | null;
  domain?: CustomDomain | null;
}): BrandingRuntime {
  const profile = input.profile;
  if (!profile) {
    return {
      tenantId: input.tenantId,
      cssVariables: {},
      cssText: "",
      logo: { light: null, dark: null, monochrome: null, width: null, height: null },
      icons: { favicon: null, appIcon192: null, appIcon512: null, touchIcon: null },
      headerFooter: { footerLinks: [] },
      loginPage: {},
      pdfExport: { logo: null, pageNumbers: true },
      publicPages: { showPoweredBy: true },
      themeKey: null,
      emailIdentity: input.emailIdentity ?? null,
      domain: input.domain ?? null,
    };
  }
  const vars = brandingCssVars(profile);
  return {
    tenantId: input.tenantId,
    cssVariables: vars,
    cssText: serializeCssVars(vars),
    logo: profile.logo,
    icons: profile.icons,
    headerFooter: profile.header_footer,
    loginPage: profile.login_page,
    pdfExport: profile.pdf_export,
    publicPages: profile.public_pages,
    themeKey: profile.theme_key,
    emailIdentity: input.emailIdentity ?? null,
    domain: input.domain ?? null,
  };
}

export type EmailIdentityEnvelope = {
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  verified: boolean;
};

export function applyEmailIdentity(
  identity: EmailIdentity | null,
  fallback: EmailIdentityEnvelope = {
    fromName: "ZiroWork",
    fromEmail: "noreply@ziro.work",
    replyTo: null,
    verified: false,
  },
): EmailIdentityEnvelope {
  if (!identity) return fallback;
  return {
    fromName: identity.from_name,
    fromEmail: identity.from_email,
    replyTo: identity.reply_to_email ?? null,
    verified:
      identity.status === "verified" || identity.status === "pending"
        ? identity.status === "verified"
        : false,
  };
}

export function resolveDomainHostStub(host: string): {
  host: string;
  isCustom: boolean;
} {
  const h = (host || "").toLowerCase();
  const hostname = h.split(":")[0] ?? "";
  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]";
  return {
    host: h,
    isCustom:
      h.length > 0 &&
      !isLocal &&
      !h.endsWith(".ziro.work") &&
      !h.endsWith(".vercel.app"),
  };
}
