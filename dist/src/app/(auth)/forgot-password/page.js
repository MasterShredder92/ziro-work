import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { headers } from "next/headers";
import { getBrandingProfile } from "@/lib/branding";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Forgot Password · ZiroWork" };
export default async function ForgotPasswordPage() {
    var _a, _b, _c, _d, _e;
    const h = await headers();
    const tenantId = ((_a = h.get("x-tenant-id")) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const profile = await getBrandingProfile(tenantId);
    const lp = profile === null || profile === void 0 ? void 0 : profile.login_page;
    const bg = (_c = (_b = lp === null || lp === void 0 ? void 0 : lp.backgroundColor) !== null && _b !== void 0 ? _b : profile === null || profile === void 0 ? void 0 : profile.colors.background) !== null && _c !== void 0 ? _c : "var(--z-bg)";
    const accent = (_e = (_d = lp === null || lp === void 0 ? void 0 : lp.accentColor) !== null && _d !== void 0 ? _d : profile === null || profile === void 0 ? void 0 : profile.colors.accent) !== null && _e !== void 0 ? _e : "#00ff88";
    return (_jsx("main", { className: "min-h-screen flex items-center justify-center p-6", style: { background: bg }, children: _jsxs("div", { className: "w-full max-w-md space-y-6 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 shadow-xl", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-[var(--z-fg)]", children: "Reset your password" }), _jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: "Enter your email address and we'll send you a link to reset your password." })] }), _jsx("div", { className: "h-1 rounded-full", style: { background: accent }, "aria-hidden": true }), _jsx(ForgotPasswordForm, { accent: accent })] }) }));
}
