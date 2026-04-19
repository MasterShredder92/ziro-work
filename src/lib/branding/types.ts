import type {
  BrandingColorPalette,
  BrandingComponentTokens,
  BrandingDraftPayload,
  BrandingHeaderFooter,
  BrandingIcons,
  BrandingLoginPage,
  BrandingLogo,
  BrandingPdfExport,
  BrandingProfileRow,
  BrandingProfileStatus,
  BrandingPublicPages,
  BrandingTypography,
} from "@data/brandingProfiles";
import type {
  BrandingDomainRow,
  BrandingDomainStatus,
} from "@data/brandingDomains";
import type {
  BrandingEmailIdentityRow,
  EmailIdentityStatus,
} from "@data/brandingEmailIdentities";
import type {
  BrandingLayoutConfigRow,
  DashboardPreset,
  LayoutPreset,
  PortalScope,
  SidebarVariant,
  WidgetSlot,
} from "@data/brandingLayoutConfigs";
import type {
  BrandingThemeRow,
  ThemePresetTokens,
} from "@data/brandingThemes";

export type BrandingProfile = BrandingProfileRow;
export type ThemePreset = BrandingThemeRow;
export type CustomDomain = BrandingDomainRow;
export type EmailIdentity = BrandingEmailIdentityRow;
export type PortalLayoutConfig = BrandingLayoutConfigRow;

export type {
  BrandingProfileStatus,
  BrandingColorPalette,
  BrandingTypography,
  BrandingComponentTokens,
  BrandingLogo,
  BrandingIcons,
  BrandingHeaderFooter,
  BrandingLoginPage,
  BrandingPdfExport,
  BrandingPublicPages,
  BrandingDraftPayload,
  BrandingDomainStatus,
  EmailIdentityStatus,
  ThemePresetTokens,
  PortalScope,
  LayoutPreset,
  SidebarVariant,
  DashboardPreset,
  WidgetSlot,
};

export type BrandingKpis = {
  profileStatus: BrandingProfileStatus;
  publishedAt: string | null;
  domainCount: number;
  verifiedDomainCount: number;
  activeEmailIdentity: string | null;
  identityVerified: boolean;
  themeKey: string | null;
  layoutsConfigured: number;
  layoutsMissing: number;
};

export type BrandingDashboardData = {
  tenantId: string;
  generatedAt: string;
  profile: BrandingProfile | null;
  themes: ThemePreset[];
  activeTheme: ThemePreset | null;
  domains: CustomDomain[];
  emailIdentities: EmailIdentity[];
  primaryEmailIdentity: EmailIdentity | null;
  layouts: PortalLayoutConfig[];
  kpis: BrandingKpis;
};

export type BrandingRuntime = {
  tenantId: string;
  cssVariables: Record<string, string>;
  cssText: string;
  logo: BrandingLogo;
  icons: BrandingIcons;
  headerFooter: BrandingHeaderFooter;
  loginPage: BrandingLoginPage;
  pdfExport: BrandingPdfExport;
  publicPages: BrandingPublicPages;
  themeKey: string | null;
  emailIdentity: EmailIdentity | null;
  domain: CustomDomain | null;
};
