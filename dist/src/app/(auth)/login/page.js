import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import Link from "next/link";
import { getBrandingProfile } from "@/lib/branding";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { LoginPageClient } from "./LoginPageClient";
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams, }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const sp = await searchParams;
    const h = await headers();
    const tenantId = ((_a = h.get("x-tenant-id")) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const profile = await getBrandingProfile(tenantId);
    const lp = profile === null || profile === void 0 ? void 0 : profile.login_page;
    const bg = (_c = (_b = lp === null || lp === void 0 ? void 0 : lp.backgroundColor) !== null && _b !== void 0 ? _b : profile === null || profile === void 0 ? void 0 : profile.colors.background) !== null && _c !== void 0 ? _c : "var(--z-bg)";
    const accent = (_e = (_d = lp === null || lp === void 0 ? void 0 : lp.accentColor) !== null && _d !== void 0 ? _d : profile === null || profile === void 0 ? void 0 : profile.colors.accent) !== null && _e !== void 0 ? _e : "#00ff88";
    const nextHref = ((_f = sp.next) === null || _f === void 0 ? void 0 : _f.startsWith("/")) ? sp.next : "/dashboard";
    const logoAlt = (profile === null || profile === void 0 ? void 0 : profile.name) ? `${profile.name} logo` : "Studio logo";
    return (_jsxs("main", { className: "min-h-screen flex flex-col md:flex-row", style: { background: bg }, "aria-labelledby": "login-title", children: [_jsxs("div", { className: "relative md:w-1/2 min-h-[40vh] md:min-h-screen border-b md:border-b-0 md:border-r border-[var(--z-border)] overflow-hidden", style: {
                    backgroundImage: (lp === null || lp === void 0 ? void 0 : lp.heroImage) ? `url(${lp.heroImage})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }, children: [_jsx("div", { className: "absolute inset-0 bg-[color-mix(in_oklab,var(--z-bg),transparent_35%)]" }), _jsxs("div", { className: "relative z-10 p-8 md:p-12 flex flex-col justify-end h-full", children: [((_g = profile === null || profile === void 0 ? void 0 : profile.logo) === null || _g === void 0 ? void 0 : _g.light) ? (_jsx("img", { src: profile.logo.light, alt: logoAlt, className: "h-10 w-auto mb-4" })) : null, _jsx("h1", { id: "login-title", className: "text-2xl md:text-3xl font-semibold text-[var(--z-fg)]", children: (_h = lp === null || lp === void 0 ? void 0 : lp.heroHeadline) !== null && _h !== void 0 ? _h : "Sign in to your workspace" }), (lp === null || lp === void 0 ? void 0 : lp.heroSubline) ? (_jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)] max-w-md", children: lp.heroSubline })) : null] })] }), _jsx("div", { className: "flex-1 flex items-center justify-center p-8 md:p-12", children: _jsxs("div", { className: "w-full max-w-md space-y-6 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 shadow-xl", children: [_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Tenant-branded login \u2014 connect your identity provider or continue with email once wired." }), _jsx("div", { className: "h-1 rounded-full", style: { background: accent }, "aria-hidden": true }), _jsx(LoginPageClient, { accent: accent, nextHref: nextHref }), _jsx(Link, { href: nextHref, className: "block w-full rounded-[var(--z-radius-md)] px-4 py-3 text-center text-sm font-semibold text-[var(--z-fg)] outline-none transition border border-[var(--z-border)] bg-[var(--z-bg)]", children: "Continue without sign-in" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)] text-center", children: ["Custom domains set ", _jsx("code", { className: "font-mono", children: "x-tenant-id" }), " ", "via middleware for white-label hosts."] })] }) })] }));
}
