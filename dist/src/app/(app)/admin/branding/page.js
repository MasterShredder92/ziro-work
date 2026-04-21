import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from "next/link";
import { PORTAL_SCOPES } from "@data/brandingLayoutConfigs";
import { getBrandingDashboard } from "@/lib/branding";
import { resolveBrandingDashboardContext } from "./guard";
import { resolveBrandingTenantId } from "./tenant";
import { BrandingForbidden } from "./BrandingForbidden";
export const dynamic = "force-dynamic";
function Stat({ label, value }) {
    return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: label }), _jsx("div", { className: "mt-1 text-lg font-semibold text-[var(--z-fg)]", children: value })] }));
}
export default async function BrandingDashboardPage({ searchParams, }) {
    var _a, _b, _c;
    const params = await searchParams;
    const tenantId = await resolveBrandingTenantId(params);
    let ctx;
    try {
        ctx = await resolveBrandingDashboardContext({ tenantId });
    }
    catch (_d) {
        ctx = undefined;
    }
    if (!ctx)
        return _jsx(BrandingForbidden, {});
    const data = await getBrandingDashboard(ctx.tenantId);
    const k = data.kpis;
    const profile = data.profile;
    return (_jsxs("div", { className: "space-y-6", id: "overview", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Branding dashboard" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Logo, colors, domain & email identity" }), _jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: ctx.canWrite
                            ? "Edit themes, domains, and layouts in each section."
                            : "Read-only — contact a platform admin to publish changes." }), _jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Updated ", new Date(data.generatedAt).toLocaleString()] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3", children: [_jsx(Stat, { label: "Profile status", value: k.profileStatus }), _jsx(Stat, { label: "Domains", value: String(k.domainCount) }), _jsx(Stat, { label: "Verified domains", value: String(k.verifiedDomainCount) }), _jsx(Stat, { label: "Primary email", value: k.activeEmailIdentity ? "Set" : "Not set" }), _jsx(Stat, { label: "Theme key", value: (_a = k.themeKey) !== null && _a !== void 0 ? _a : "—" }), _jsx(Stat, { label: "Layouts", value: `${k.layoutsConfigured}/${PORTAL_SCOPES.length}` })] }), _jsxs("section", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Logos" }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Light / dark variants drive headers and login." }), _jsxs("div", { className: "text-xs font-mono text-[var(--z-fg)]", children: [((_b = profile === null || profile === void 0 ? void 0 : profile.logo) === null || _b === void 0 ? void 0 : _b.light) ? "Light · set" : "Light · not set", " \u00B7", " ", ((_c = profile === null || profile === void 0 ? void 0 : profile.logo) === null || _c === void 0 ? void 0 : _c.dark) ? "Dark · set" : "Dark · not set"] })] }), _jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Colors" }), _jsx("div", { className: "flex gap-2 flex-wrap", children: profile ? (_jsxs(_Fragment, { children: [_jsx(Swatch, { c: profile.colors.primary }), _jsx(Swatch, { c: profile.colors.secondary }), _jsx(Swatch, { c: profile.colors.accent }), _jsx(Swatch, { c: profile.colors.background }), _jsx(Swatch, { c: profile.colors.surface })] })) : (_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "No profile yet" })) })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Link, { href: "/admin/branding/theme", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#00ff88]/40", children: "Theme editor" }), _jsx(Link, { href: "/admin/branding/domain", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#00ff88]/40", children: "Domains" }), _jsx(Link, { href: "/admin/branding/email", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#00ff88]/40", children: "Email identity" }), _jsx(Link, { href: "/admin/branding/layouts", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#00ff88]/40", children: "Portal layouts" }), _jsx(Link, { href: "/admin/branding/preview", className: "rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 py-1.5 text-xs font-semibold text-[#00ff88]", children: "Live preview" })] })] }));
}
function Swatch({ c }) {
    return (_jsx("span", { className: "inline-block h-8 w-8 rounded border border-[var(--z-border)]", style: { background: c }, title: c }));
}
