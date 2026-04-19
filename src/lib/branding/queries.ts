import {
  deleteBrandingProfile as deleteBrandingProfileData,
  getBrandingProfile as getBrandingProfileData,
  getBrandingProfileById as getBrandingProfileByIdData,
  listBrandingProfiles as listBrandingProfilesData,
  upsertBrandingProfile as upsertBrandingProfileData,
  type BrandingProfileRow,
} from "@data/brandingProfiles";
import {
  deleteBrandingTheme as deleteBrandingThemeData,
  getBrandingTheme as getBrandingThemeData,
  listBrandingThemes as listBrandingThemesData,
  upsertBrandingTheme as upsertBrandingThemeData,
  type BrandingThemeRow,
} from "@data/brandingThemes";
import {
  deleteBrandingDomain as deleteBrandingDomainData,
  getBrandingDomain as getBrandingDomainData,
  getBrandingDomainByName as getBrandingDomainByNameData,
  listBrandingDomains as listBrandingDomainsData,
  upsertBrandingDomain as upsertBrandingDomainData,
  type BrandingDomainRow,
} from "@data/brandingDomains";
import {
  deleteBrandingEmailIdentity as deleteBrandingEmailIdentityData,
  getBrandingEmailIdentity as getBrandingEmailIdentityData,
  getPrimaryBrandingEmailIdentity as getPrimaryBrandingEmailIdentityData,
  listBrandingEmailIdentities as listBrandingEmailIdentitiesData,
  upsertBrandingEmailIdentity as upsertBrandingEmailIdentityData,
  type BrandingEmailIdentityRow,
} from "@data/brandingEmailIdentities";
import {
  deleteBrandingLayout as deleteBrandingLayoutData,
  getBrandingLayout as getBrandingLayoutData,
  listBrandingLayouts as listBrandingLayoutsData,
  upsertBrandingLayout as upsertBrandingLayoutData,
  type BrandingLayoutConfigRow,
  type PortalScope,
} from "@data/brandingLayoutConfigs";

export async function listBrandingProfiles(
  tenantId: string,
): Promise<BrandingProfileRow[]> {
  return listBrandingProfilesData(tenantId);
}

export async function getBrandingProfile(
  tenantId: string,
): Promise<BrandingProfileRow | null> {
  return getBrandingProfileData(tenantId);
}

export async function getBrandingProfileById(
  id: string,
  tenantId?: string,
): Promise<BrandingProfileRow | null> {
  return getBrandingProfileByIdData(id, tenantId);
}

export async function upsertBrandingProfile(
  tenantId: string,
  input: Partial<BrandingProfileRow>,
): Promise<BrandingProfileRow> {
  return upsertBrandingProfileData(tenantId, input);
}

export async function deleteBrandingProfile(
  id: string,
  tenantId: string,
): Promise<boolean> {
  return deleteBrandingProfileData(id, tenantId);
}

export async function listBrandingThemes(
  tenantId: string,
): Promise<BrandingThemeRow[]> {
  return listBrandingThemesData(tenantId);
}

export async function getBrandingTheme(
  themeKey: string,
  tenantId: string,
): Promise<BrandingThemeRow | null> {
  return getBrandingThemeData(themeKey, tenantId);
}

export async function upsertBrandingTheme(
  tenantId: string,
  input: Partial<BrandingThemeRow> & { theme_key: string },
): Promise<BrandingThemeRow> {
  return upsertBrandingThemeData(tenantId, input);
}

export async function deleteBrandingTheme(
  themeKey: string,
  tenantId: string,
): Promise<boolean> {
  return deleteBrandingThemeData(themeKey, tenantId);
}

export async function listBrandingDomains(
  tenantId: string,
): Promise<BrandingDomainRow[]> {
  return listBrandingDomainsData(tenantId);
}

export async function getBrandingDomain(
  id: string,
  tenantId?: string,
): Promise<BrandingDomainRow | null> {
  return getBrandingDomainData(id, tenantId);
}

export async function getBrandingDomainByName(
  domainName: string,
  tenantId?: string,
): Promise<BrandingDomainRow | null> {
  return getBrandingDomainByNameData(domainName, tenantId);
}

export async function upsertBrandingDomain(
  tenantId: string,
  input: Partial<BrandingDomainRow> & { domain_name: string },
): Promise<BrandingDomainRow> {
  return upsertBrandingDomainData(tenantId, input);
}

export async function deleteBrandingDomain(
  id: string,
  tenantId: string,
): Promise<boolean> {
  return deleteBrandingDomainData(id, tenantId);
}

export async function listBrandingEmailIdentities(
  tenantId: string,
): Promise<BrandingEmailIdentityRow[]> {
  return listBrandingEmailIdentitiesData(tenantId);
}

export async function getPrimaryBrandingEmailIdentity(
  tenantId: string,
): Promise<BrandingEmailIdentityRow | null> {
  return getPrimaryBrandingEmailIdentityData(tenantId);
}

export async function getBrandingEmailIdentity(
  id: string,
  tenantId?: string,
): Promise<BrandingEmailIdentityRow | null> {
  return getBrandingEmailIdentityData(id, tenantId);
}

export async function upsertBrandingEmailIdentity(
  tenantId: string,
  input: Partial<BrandingEmailIdentityRow>,
): Promise<BrandingEmailIdentityRow> {
  return upsertBrandingEmailIdentityData(tenantId, input);
}

export async function deleteBrandingEmailIdentity(
  id: string,
  tenantId: string,
): Promise<boolean> {
  return deleteBrandingEmailIdentityData(id, tenantId);
}

export async function listBrandingLayouts(
  tenantId: string,
): Promise<BrandingLayoutConfigRow[]> {
  return listBrandingLayoutsData(tenantId);
}

export async function getBrandingLayout(
  scope: PortalScope,
  tenantId: string,
): Promise<BrandingLayoutConfigRow | null> {
  return getBrandingLayoutData(scope, tenantId);
}

export async function upsertBrandingLayout(
  tenantId: string,
  input: Partial<BrandingLayoutConfigRow> & { scope: PortalScope },
): Promise<BrandingLayoutConfigRow> {
  return upsertBrandingLayoutData(tenantId, input);
}

export async function deleteBrandingLayout(
  id: string,
  tenantId: string,
): Promise<boolean> {
  return deleteBrandingLayoutData(id, tenantId);
}
