import "server-only";
import { PORTAL_SCOPES } from "@data/brandingLayoutConfigs";
import { assertTenantAccess } from "@/lib/auth/guards";
import { deleteBrandingDomain, deleteBrandingEmailIdentity, deleteBrandingLayout, deleteBrandingProfile, deleteBrandingTheme, getBrandingDomain, getBrandingDomainByName, getBrandingEmailIdentity, getBrandingLayout, getBrandingProfile, getBrandingProfileById, getBrandingTheme, getPrimaryBrandingEmailIdentity, listBrandingDomains, listBrandingEmailIdentities, listBrandingLayouts, listBrandingProfiles, listBrandingThemes, upsertBrandingDomain, upsertBrandingEmailIdentity, upsertBrandingLayout, upsertBrandingProfile, upsertBrandingTheme, } from "./queries";
export { getBrandingProfile, getBrandingProfileById, getBrandingDomain, getBrandingDomainByName, getBrandingEmailIdentity, getPrimaryBrandingEmailIdentity, getBrandingLayout, getBrandingTheme, listBrandingProfiles, listBrandingThemes, listBrandingDomains, listBrandingEmailIdentities, listBrandingLayouts, };
import { buildBrandingRuntime } from "./runtime";
function emptyKpis() {
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
function computeKpis(input) {
    var _a, _b, _c;
    const kpis = emptyKpis();
    if (input.profile) {
        kpis.profileStatus = input.profile.status;
        kpis.publishedAt = input.profile.published_at;
        kpis.themeKey = input.profile.theme_key;
    }
    kpis.domainCount = input.domains.length;
    kpis.verifiedDomainCount = input.domains.filter((d) => d.status === "verified" || d.status === "active").length;
    kpis.activeEmailIdentity = (_b = (_a = input.primary) === null || _a === void 0 ? void 0 : _a.from_email) !== null && _b !== void 0 ? _b : null;
    kpis.identityVerified = ((_c = input.primary) === null || _c === void 0 ? void 0 : _c.status) === "verified";
    kpis.layoutsConfigured = input.layouts.length;
    kpis.layoutsMissing = Math.max(PORTAL_SCOPES.length - input.layouts.length, 0);
    void input.themes;
    return kpis;
}
export async function getBrandingDashboard(tenantId) {
    var _a;
    await assertTenantAccess(tenantId);
    const [profile, themes, domains, identities, primary, layouts] = await Promise.all([
        getBrandingProfile(tenantId),
        listBrandingThemes(tenantId),
        listBrandingDomains(tenantId),
        listBrandingEmailIdentities(tenantId),
        getPrimaryBrandingEmailIdentity(tenantId),
        listBrandingLayouts(tenantId),
    ]);
    const activeTheme = (profile === null || profile === void 0 ? void 0 : profile.theme_key)
        ? ((_a = themes.find((t) => t.theme_key === profile.theme_key)) !== null && _a !== void 0 ? _a : null)
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
export async function getBrandingRuntime(tenantId) {
    const [profile, domain, identity] = await Promise.all([
        getBrandingProfile(tenantId),
        listBrandingDomains(tenantId).then((list) => {
            var _a, _b, _c;
            return (_c = (_b = (_a = list.find((d) => d.is_primary)) !== null && _a !== void 0 ? _a : list.find((d) => d.status === "active")) !== null && _b !== void 0 ? _b : list[0]) !== null && _c !== void 0 ? _c : null;
        }),
        getPrimaryBrandingEmailIdentity(tenantId),
    ]);
    return buildBrandingRuntime({
        tenantId,
        profile,
        domain,
        emailIdentity: identity,
    });
}
export async function saveBrandingProfile(tenantId, input) {
    await assertTenantAccess(tenantId);
    return upsertBrandingProfile(tenantId, input);
}
export async function publishBrandingProfile(tenantId, id, publishedBy) {
    var _a, _b;
    await assertTenantAccess(tenantId);
    const existing = await getBrandingProfileById(id, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    const draft = (_a = existing.draft) !== null && _a !== void 0 ? _a : null;
    const merged = Object.assign(Object.assign({}, existing), { id: existing.id, status: "published", published_at: new Date().toISOString(), published_by: (_b = publishedBy !== null && publishedBy !== void 0 ? publishedBy : existing.published_by) !== null && _b !== void 0 ? _b : null, draft: null });
    if (draft) {
        if (draft.colors)
            merged.colors = Object.assign(Object.assign({}, existing.colors), draft.colors);
        if (draft.typography)
            merged.typography = Object.assign(Object.assign({}, existing.typography), draft.typography);
        if (draft.components)
            merged.components = Object.assign(Object.assign({}, existing.components), draft.components);
        if (draft.logo)
            merged.logo = Object.assign(Object.assign({}, existing.logo), draft.logo);
        if (draft.icons)
            merged.icons = Object.assign(Object.assign({}, existing.icons), draft.icons);
        if (draft.header_footer)
            merged.header_footer = Object.assign(Object.assign({}, existing.header_footer), draft.header_footer);
        if (draft.login_page)
            merged.login_page = Object.assign(Object.assign({}, existing.login_page), draft.login_page);
        if (draft.pdf_export)
            merged.pdf_export = Object.assign(Object.assign({}, existing.pdf_export), draft.pdf_export);
        if (draft.public_pages)
            merged.public_pages = Object.assign(Object.assign({}, existing.public_pages), draft.public_pages);
    }
    return upsertBrandingProfile(tenantId, merged);
}
export async function saveBrandingDraft(tenantId, id, draft) {
    await assertTenantAccess(tenantId);
    const existing = await getBrandingProfileById(id, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    return upsertBrandingProfile(tenantId, Object.assign(Object.assign({}, existing), { draft, status: existing.status === "published" ? "published" : "draft" }));
}
export async function saveTheme(tenantId, input) {
    await assertTenantAccess(tenantId);
    return upsertBrandingTheme(tenantId, input);
}
export async function applyThemeToProfile(tenantId, themeKey) {
    var _a, _b, _c, _d;
    await assertTenantAccess(tenantId);
    const theme = await getBrandingTheme(themeKey, tenantId);
    if (!theme)
        throw new Error("NOT_FOUND");
    const existing = await getBrandingProfile(tenantId);
    return upsertBrandingProfile(tenantId, Object.assign(Object.assign({}, (existing !== null && existing !== void 0 ? existing : {})), { theme_key: theme.theme_key, colors: Object.assign(Object.assign({}, ((_a = existing === null || existing === void 0 ? void 0 : existing.colors) !== null && _a !== void 0 ? _a : {})), theme.tokens.colors), typography: Object.assign(Object.assign({}, ((_b = existing === null || existing === void 0 ? void 0 : existing.typography) !== null && _b !== void 0 ? _b : {})), theme.tokens.typography), components: Object.assign(Object.assign({}, ((_c = existing === null || existing === void 0 ? void 0 : existing.components) !== null && _c !== void 0 ? _c : {})), theme.tokens.components), status: (existing === null || existing === void 0 ? void 0 : existing.status) === "published" ? "draft" : ((_d = existing === null || existing === void 0 ? void 0 : existing.status) !== null && _d !== void 0 ? _d : "draft") }));
}
export async function removeTheme(tenantId, themeKey) {
    await assertTenantAccess(tenantId);
    return deleteBrandingTheme(themeKey, tenantId);
}
export async function createDomain(tenantId, input) {
    var _a;
    await assertTenantAccess(tenantId);
    const existing = await getBrandingDomainByName(input.domain_name, tenantId);
    if (existing)
        return existing;
    return upsertBrandingDomain(tenantId, {
        domain_name: input.domain_name,
        is_primary: (_a = input.is_primary) !== null && _a !== void 0 ? _a : false,
        status: "pending",
    });
}
export async function verifyDomain(tenantId, id) {
    await assertTenantAccess(tenantId);
    const existing = await getBrandingDomain(id, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    const now = new Date().toISOString();
    const nextStatus = existing.status === "verified" || existing.status === "active"
        ? existing.status
        : "verifying";
    return upsertBrandingDomain(tenantId, Object.assign(Object.assign({}, existing), { id: existing.id, status: nextStatus, last_checked_at: now, failure_reason: null }));
}
export async function markDomainVerified(tenantId, id) {
    await assertTenantAccess(tenantId);
    const existing = await getBrandingDomain(id, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    const now = new Date().toISOString();
    return upsertBrandingDomain(tenantId, Object.assign(Object.assign({}, existing), { id: existing.id, status: "verified", verified_at: now, last_checked_at: now, failure_reason: null }));
}
export async function activateDomain(tenantId, id) {
    await assertTenantAccess(tenantId);
    const existing = await getBrandingDomain(id, tenantId);
    if (!existing)
        throw new Error("NOT_FOUND");
    if (existing.status !== "verified" && existing.status !== "active") {
        throw new Error("DOMAIN_NOT_VERIFIED");
    }
    return upsertBrandingDomain(tenantId, Object.assign(Object.assign({}, existing), { id: existing.id, status: "active", is_primary: true }));
}
export async function removeDomain(tenantId, id) {
    await assertTenantAccess(tenantId);
    return deleteBrandingDomain(id, tenantId);
}
export async function saveEmailIdentity(tenantId, input) {
    await assertTenantAccess(tenantId);
    return upsertBrandingEmailIdentity(tenantId, input);
}
export async function sendTestEmailIdentity(tenantId, id, toEmail) {
    await assertTenantAccess(tenantId);
    const identity = await getBrandingEmailIdentity(id, tenantId);
    if (!identity)
        throw new Error("NOT_FOUND");
    const now = new Date().toISOString();
    await upsertBrandingEmailIdentity(tenantId, Object.assign(Object.assign({}, identity), { id: identity.id, last_tested_at: now }));
    return {
        ok: true,
        messageId: `stub-${identity.id}-${Date.now()}`,
        to: toEmail,
        from: `${identity.from_name} <${identity.from_email}>`,
    };
}
export async function removeEmailIdentity(tenantId, id) {
    await assertTenantAccess(tenantId);
    return deleteBrandingEmailIdentity(id, tenantId);
}
export async function saveLayout(tenantId, input) {
    await assertTenantAccess(tenantId);
    return upsertBrandingLayout(tenantId, input);
}
export async function removeLayout(tenantId, id) {
    await assertTenantAccess(tenantId);
    return deleteBrandingLayout(id, tenantId);
}
export async function getLayoutForScope(tenantId, scope) {
    return getBrandingLayout(scope, tenantId);
}
export async function listProfiles(tenantId) {
    return listBrandingProfiles(tenantId);
}
export async function deleteProfile(tenantId, id) {
    await assertTenantAccess(tenantId);
    return deleteBrandingProfile(id, tenantId);
}
