import { deleteBrandingProfile as deleteBrandingProfileData, getBrandingProfile as getBrandingProfileData, getBrandingProfileById as getBrandingProfileByIdData, listBrandingProfiles as listBrandingProfilesData, upsertBrandingProfile as upsertBrandingProfileData, } from "@data/brandingProfiles";
import { deleteBrandingTheme as deleteBrandingThemeData, getBrandingTheme as getBrandingThemeData, listBrandingThemes as listBrandingThemesData, upsertBrandingTheme as upsertBrandingThemeData, } from "@data/brandingThemes";
import { deleteBrandingDomain as deleteBrandingDomainData, getBrandingDomain as getBrandingDomainData, getBrandingDomainByName as getBrandingDomainByNameData, listBrandingDomains as listBrandingDomainsData, upsertBrandingDomain as upsertBrandingDomainData, } from "@data/brandingDomains";
import { deleteBrandingEmailIdentity as deleteBrandingEmailIdentityData, getBrandingEmailIdentity as getBrandingEmailIdentityData, getPrimaryBrandingEmailIdentity as getPrimaryBrandingEmailIdentityData, listBrandingEmailIdentities as listBrandingEmailIdentitiesData, upsertBrandingEmailIdentity as upsertBrandingEmailIdentityData, } from "@data/brandingEmailIdentities";
import { deleteBrandingLayout as deleteBrandingLayoutData, getBrandingLayout as getBrandingLayoutData, listBrandingLayouts as listBrandingLayoutsData, upsertBrandingLayout as upsertBrandingLayoutData, } from "@data/brandingLayoutConfigs";
export async function listBrandingProfiles(tenantId) {
    return listBrandingProfilesData(tenantId);
}
export async function getBrandingProfile(tenantId) {
    return getBrandingProfileData(tenantId);
}
export async function getBrandingProfileById(id, tenantId) {
    return getBrandingProfileByIdData(id, tenantId);
}
export async function upsertBrandingProfile(tenantId, input) {
    return upsertBrandingProfileData(tenantId, input);
}
export async function deleteBrandingProfile(id, tenantId) {
    return deleteBrandingProfileData(id, tenantId);
}
export async function listBrandingThemes(tenantId) {
    return listBrandingThemesData(tenantId);
}
export async function getBrandingTheme(themeKey, tenantId) {
    return getBrandingThemeData(themeKey, tenantId);
}
export async function upsertBrandingTheme(tenantId, input) {
    return upsertBrandingThemeData(tenantId, input);
}
export async function deleteBrandingTheme(themeKey, tenantId) {
    return deleteBrandingThemeData(themeKey, tenantId);
}
export async function listBrandingDomains(tenantId) {
    return listBrandingDomainsData(tenantId);
}
export async function getBrandingDomain(id, tenantId) {
    return getBrandingDomainData(id, tenantId);
}
export async function getBrandingDomainByName(domainName, tenantId) {
    return getBrandingDomainByNameData(domainName, tenantId);
}
export async function upsertBrandingDomain(tenantId, input) {
    return upsertBrandingDomainData(tenantId, input);
}
export async function deleteBrandingDomain(id, tenantId) {
    return deleteBrandingDomainData(id, tenantId);
}
export async function listBrandingEmailIdentities(tenantId) {
    return listBrandingEmailIdentitiesData(tenantId);
}
export async function getPrimaryBrandingEmailIdentity(tenantId) {
    return getPrimaryBrandingEmailIdentityData(tenantId);
}
export async function getBrandingEmailIdentity(id, tenantId) {
    return getBrandingEmailIdentityData(id, tenantId);
}
export async function upsertBrandingEmailIdentity(tenantId, input) {
    return upsertBrandingEmailIdentityData(tenantId, input);
}
export async function deleteBrandingEmailIdentity(id, tenantId) {
    return deleteBrandingEmailIdentityData(id, tenantId);
}
export async function listBrandingLayouts(tenantId) {
    return listBrandingLayoutsData(tenantId);
}
export async function getBrandingLayout(scope, tenantId) {
    return getBrandingLayoutData(scope, tenantId);
}
export async function upsertBrandingLayout(tenantId, input) {
    return upsertBrandingLayoutData(tenantId, input);
}
export async function deleteBrandingLayout(id, tenantId) {
    return deleteBrandingLayoutData(id, tenantId);
}
