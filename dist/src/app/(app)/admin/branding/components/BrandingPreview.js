"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrandingPreviewDeviceFrame } from "@/components/branding/BrandingPreviewDeviceFrame";
export function BrandingPreview({ logo, colors, typography, headerFooter, device = "desktop", }) {
    var _a, _b, _c;
    return (_jsx(BrandingPreviewDeviceFrame, { device: device, children: _jsxs("div", { "data-branding-preview": true, className: "rounded-[var(--brand-card-radius,1rem)] border overflow-hidden", style: {
                background: colors.background,
                color: "#eaeaea",
                borderColor: "rgba(255,255,255,0.08)",
                fontFamily: typography.bodyFamily,
                fontSize: "var(--brand-font-base-size, 16px)",
                lineHeight: "var(--brand-font-line-height, 1.5)",
            }, children: [_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 border-b", style: {
                        background: colors.surface,
                        borderColor: "rgba(255,255,255,0.08)",
                    }, children: [logo.dark || logo.light ? (_jsx("img", { src: (_b = (_a = logo.dark) !== null && _a !== void 0 ? _a : logo.light) !== null && _b !== void 0 ? _b : "", alt: "Logo", className: "h-6 object-contain" })) : (_jsx("span", { className: "inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold", style: { background: colors.accent, color: colors.background }, children: "Z" })), _jsx("div", { className: "text-sm font-semibold", children: (_c = headerFooter === null || headerFooter === void 0 ? void 0 : headerFooter.headerTagline) !== null && _c !== void 0 ? _c : "Workspace" })] }), _jsxs("div", { className: "px-4 py-5 space-y-3", children: [_jsx("h2", { className: "text-xl font-semibold", style: {
                                color: colors.primary,
                                fontFamily: typography.headingFamily,
                            }, children: "Welcome back" }), _jsx("p", { className: "text-sm", style: { color: "rgba(255,255,255,0.72)" }, children: "This is how your portals will look to users." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "text-xs font-semibold px-3 py-2 rounded-[var(--brand-button-radius,0.75rem)]", style: { background: colors.primary, color: colors.background }, children: "Primary action" }), _jsx("button", { type: "button", className: "text-xs font-semibold px-3 py-2 rounded-[var(--brand-button-radius,0.75rem)] border", style: {
                                        borderColor: "rgba(255,255,255,0.2)",
                                        color: colors.accent,
                                    }, children: "Secondary" })] }), _jsxs("div", { className: "rounded-[var(--brand-card-radius,1rem)] p-3", style: {
                                background: colors.surface,
                                border: "1px solid rgba(255,255,255,0.08)",
                            }, children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider font-semibold", style: { color: "rgba(255,255,255,0.5)" }, children: "Card" }), _jsx("div", { className: "text-sm", style: { color: "rgba(255,255,255,0.9)" }, children: "Lorem ipsum dolor sit amet." })] })] }), (headerFooter === null || headerFooter === void 0 ? void 0 : headerFooter.footerText) ? (_jsx("div", { className: "px-4 py-2 text-[11px]", style: {
                        background: colors.surface,
                        color: "rgba(255,255,255,0.55)",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                    }, children: headerFooter.footerText })) : null] }) }));
}
