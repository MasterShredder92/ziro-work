import "server-only";
import { PORTAL_SCOPES } from "@data/brandingLayoutConfigs";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  deleteBrandingDomain,
  deleteBrandingEmailIdentity,
  deleteBrandingLayout,
  deleteBrandingProfile,
  deleteBrandingTheme,
  getBrandingDomain,
  getBrandingDomainByName,
  getBrandingEmailIdentity,
  getBrandingLayout,
  getBrandingProfile,
  getBrandingProfileById,
  getBrandingTheme,
  getPrimaryBrandingEmailIdentity,
  listBrandingDomains,
  listBrandingEmailIdentities,
  listBrandingLayouts,
  listBrandingProfiles,
  listBrandingThemes,
  upsertBrandingDomain,
  upsertBrandingEmailIdentity,
  upsertBrandingLayout,
  upsertBrandingProfile,
  upsertBrandingTheme,
} from "./queries";

export {
  getBrandingProfile,
  getBrandingProfileById,
  getBrandingDomain,
  getBrandingDomainByName,
  getBrandingEmailIdentity,
  getPrimaryBrandingEmailIdentity,
  getBrandingLayout,
  getBrandingTheme,
  listBrandingProfiles,
  listBrandingThemes,
  listBrandingDomains,
  listBrandingEmailIdentities,
  listBrandingLayouts,
};
import { buildBrandingRuntime } from "./runtime";
import type {
  BrandingDashboardData,
  BrandingDomainStatus,
  BrandingDraftPayload,
  BrandingKpis,
  BrandingProfile,
  BrandingRuntime,
  CustomDomain,
  EmailIdentity,
  PortalLayoutConfig,
  PortalScope,
  ThemePreset,
} from "./types";

function emptyKpis(): BrandingKpis {
  return {
    profileStatus: "draft",
    publishedAt: null,
    domainCount: 0,
    verifiedDomainCount: 0,
    activeEmailIdentity: null,
    identityVerified: false,
    themeKey: null,
    layoutsConfigured: 0,
    layoutsMissing: PORTAL_SCOPES.length,
  };
}

function computeKpis(input: {
  profile: BrandingProfile | null;
  themes: ThemePreset[];
  domains: CustomDomain[];
  identities: EmailIdentity[];
  primary: EmailIdentity | null;
  layouts: PortalLayoutConfig[];
}): BrandingKpis {
  const kpis = emptyKpis();
  if (input.profile) {
    kpis.profileStatus = input.profile.status;
    kpis.publishedAt = input.profile.published_at;
    kpis.themeKey = input.profile.theme_key;
  }
  kpis.domainCount = input.domains.length;
  kpis.verifiedDomainCount = input.domains.filter(
    (d) => d.status === "verified" || d.status === "active",
  ).length;
  kpis.activeEmailIdentity = input.primary?.from_email ?? null;
  kpis.identityVerified = input.primary?.status === "verified";
  kpis.layoutsConfigured = input.layouts.length;
  kpis.layoutsMissing = Math.max(PORTAL_SCOPES.length - input.layouts.length, 0);
  void input.themes;
  return kpis;
}

export async function getBrandingDashboard(
  tenantId: string,
): Promise<BrandingDashboardData> {
  await assertTenantAccess(tenantId);

  const [profile, themes, domains, identities, primary, layouts] =
    await Promise.all([
      getBrandingProfile(tenantId),
      listBrandingThemes(tenantId),
      listBrandingDomains(tenantId),
      listBrandingEmailIdentities(tenantId),
      getPrimaryBrandingEmailIdentity(tenantId),
      listBrandingLayouts(tenantId),
    ]);

  const activeTheme = profile?.theme_key
    ? (themes.find((t) => t.theme_key === profile.theme_key) ?? null)
    : null;

  const kpis = computeKpis({
    profile,
    themes,
    domains,
    identities,
    primary,
    layouts,
  });

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    profile,
    themes,
    activeTheme,
    domains,
    emailIdentities: identities,
    primaryEmailIdentity: primary,
    layouts,
    kpis,
  };
}

export async function getBrandingRuntime(
  tenantId: string,
): Promise<BrandingRuntime> {
  const [profile, domain, identity] = await Promise.all([
    getBrandingProfile(tenantId),
    listBrandingDomains(tenantId).then(
      (list) =>
        list.find((d) => d.is_primary) ??
        list.find((d) => d.status === "active") ??
        list[0] ??
        null,
    ),
    getPrimaryBrandingEmailIdentity(tenantId),
  ]);
  return buildBrandingRuntime({
    tenantId,
    profile,
    domain,
    emailIdentity: identity,
  });
}

export async function saveBrandingProfile(
  tenantId: string,
  input: Partial<BrandingProfile>,
): Promise<BrandingProfile> {
  await assertTenantAccess(tenantId);
  return upsertBrandingProfile(tenantId, input);
}

export async function publishBrandingProfile(
  tenantId: string,
  id: string,
  publishedBy?: string | null,
): Promise<BrandingProfile> {
  await assertTenantAccess(tenantId);
  const existing = await getBrandingProfileById(id, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  const draft = existing.draft ?? null;
  const merged: Partial<BrandingProfile> = {
    ...existing,
    id: existing.id,
    status: "published",
    published_at: new Date().toISOString(),
    published_by: publishedBy ?? existing.published_by ?? null,
    draft: null,
  };
  if (draft) {
    if (draft.colors)
      merged.colors = { ...existing.colors, ...draft.colors };
    if (draft.typography)
      merged.typography = { ...existing.typography, ...draft.typography };
    if (draft.components)
      merged.components = { ...existing.components, ...draft.components };
    if (draft.logo) merged.logo = { ...existing.logo, ...draft.logo };
    if (draft.icons) merged.icons = { ...existing.icons, ...draft.icons };
    if (draft.header_footer)
      merged.header_footer = {
        ...existing.header_footer,
        ...draft.header_footer,
      };
    if (draft.login_page)
      merged.login_page = { ...existing.login_page, ...draft.login_page };
    if (draft.pdf_export)
      merged.pdf_export = { ...existing.pdf_export, ...draft.pdf_export };
    if (draft.public_pages)
      merged.public_pages = { ...existing.public_pages, ...draft.public_pages };
  }
  return upsertBrandingProfile(tenantId, merged);
}

export async function saveBrandingDraft(
  tenantId: string,
  id: string,
  draft: BrandingDraftPayload,
): Promise<BrandingProfile> {
  await assertTenantAccess(tenantId);
  const existing = await getBrandingProfileById(id, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  return upsertBrandingProfile(tenantId, {
    ...existing,
    draft,
    status: existing.status === "published" ? "published" : "draft",
  });
}

export async function saveTheme(
  tenantId: string,
  input: { theme_key: string; name?: string; description?: string | null; tokens?: ThemePreset["tokens"] },
): Promise<ThemePreset> {
  await assertTenantAccess(tenantId);
  return upsertBrandingTheme(tenantId, input);
}

export async function applyThemeToProfile(
  tenantId: string,
  themeKey: string,
): Promise<BrandingProfile> {
  await assertTenantAccess(tenantId);
  const theme = await getBrandingTheme(themeKey, tenantId);
  if (!theme) throw new Error("NOT_FOUND");
  const existing = await getBrandingProfile(tenantId);
  return upsertBrandingProfile(tenantId, {
    ...(existing ?? {}),
    theme_key: theme.theme_key,
    colors: { ...(existing?.colors ?? {}), ...theme.tokens.colors },
    typography: { ...(existing?.typography ?? {}), ...theme.tokens.typography },
    components: { ...(existing?.components ?? {}), ...theme.tokens.components },
    status: existing?.status === "published" ? "draft" : (existing?.status ?? "draft"),
  });
}

export async function removeTheme(
  tenantId: string,
  themeKey: string,
): Promise<boolean> {
  await assertTenantAccess(tenantId);
  return deleteBrandingTheme(themeKey, tenantId);
}

export async function createDomain(
  tenantId: string,
  input: { domain_name: string; is_primary?: boolean },
): Promise<CustomDomain> {
  await assertTenantAccess(tenantId);
  const existing = await getBrandingDomainByName(input.domain_name, tenantId);
  if (existing) return existing;
  return upsertBrandingDomain(tenantId, {
    domain_name: input.domain_name,
    is_primary: input.is_primary ?? false,
    status: "pending",
  });
}

export async function verifyDomain(
  tenantId: string,
  id: string,
): Promise<CustomDomain> {
  await assertTenantAccess(tenantId);
  const existing = await getBrandingDomain(id, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  const now = new Date().toISOString();
  const nextStatus: BrandingDomainStatus =
    existing.status === "verified" || existing.status === "active"
      ? existing.status
      : "verifying";
  return upsertBrandingDomain(tenantId, {
    ...existing,
    id: existing.id,
    status: nextStatus,
    last_checked_at: now,
    failure_reason: null,
  });
}

export async function markDomainVerified(
  tenantId: string,
  id: string,
): Promise<CustomDomain> {
  await assertTenantAccess(tenantId);
  const existing = await getBrandingDomain(id, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  const now = new Date().toISOString();
  return upsertBrandingDomain(tenantId, {
    ...existing,
    id: existing.id,
    status: "verified",
    verified_at: now,
    last_checked_at: now,
    failure_reason: null,
  });
}

export async function activateDomain(
  tenantId: string,
  id: string,
): Promise<CustomDomain> {
  await assertTenantAccess(tenantId);
  const existing = await getBrandingDomain(id, tenantId);
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.status !== "verified" && existing.status !== "active") {
    throw new Error("DOMAIN_NOT_VERIFIED");
  }
  return upsertBrandingDomain(tenantId, {
    ...existing,
    id: existing.id,
    status: "active",
    is_primary: true,
  });
}

export async function removeDomain(
  tenantId: string,
  id: string,
): Promise<boolean> {
  await assertTenantAccess(tenantId);
  return deleteBrandingDomain(id, tenantId);
}

export async function saveEmailIdentity(
  tenantId: string,
  input: Partial<EmailIdentity>,
): Promise<EmailIdentity> {
  await assertTenantAccess(tenantId);
  return upsertBrandingEmailIdentity(tenantId, input);
}

export async function sendTestEmailIdentity(
  tenantId: string,
  id: string,
  toEmail: string,
): Promise<{ ok: true; messageId: string; to: string; from: string }> {
  await assertTenantAccess(tenantId);
  const identity = await getBrandingEmailIdentity(id, tenantId);
  if (!identity) throw new Error("NOT_FOUND");
  const now = new Date().toISOString();
  await upsertBrandingEmailIdentity(tenantId, {
    ...identity,
    id: identity.id,
    last_tested_at: now,
  });
  return {
    ok: true,
    messageId: `stub-${identity.id}-${Date.now()}`,
    to: toEmail,
    from: `${identity.from_name} <${identity.from_email}>`,
  };
}

export async function removeEmailIdentity(
  tenantId: string,
  id: string,
): Promise<boolean> {
  await assertTenantAccess(tenantId);
  return deleteBrandingEmailIdentity(id, tenantId);
}

export async function saveLayout(
  tenantId: string,
  input: Partial<PortalLayoutConfig> & { scope: PortalScope },
): Promise<PortalLayoutConfig> {
  await assertTenantAccess(tenantId);
  return upsertBrandingLayout(tenantId, input);
}

export async function removeLayout(
  tenantId: string,
  id: string,
): Promise<boolean> {
  await assertTenantAccess(tenantId);
  return deleteBrandingLayout(id, tenantId);
}

export async function getLayoutForScope(
  tenantId: string,
  scope: PortalScope,
): Promise<PortalLayoutConfig | null> {
  return getBrandingLayout(scope, tenantId);
}

export async function listProfiles(
  tenantId: string,
): Promise<BrandingProfile[]> {
  return listBrandingProfiles(tenantId);
}

export async function deleteProfile(
  tenantId: string,
  id: string,
): Promise<boolean> {
  await assertTenantAccess(tenantId);
  return deleteBrandingProfile(id, tenantId);
}
