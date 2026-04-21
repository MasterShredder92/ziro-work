"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { previewCssFromTheme } from "@/lib/branding/runtime";
export function ThemePreviewCard({ theme }) {
    var _a;
    const css = previewCssFromTheme(theme);
    return (_jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)]", children: [_jsx("style", { dangerouslySetInnerHTML: { __html: css } }), _jsxs("div", { className: "p-4 space-y-3", style: {
                    background: theme.tokens.colors.background,
                    color: theme.tokens.colors.surface,
                }, children: [_jsx("div", { className: "text-sm font-semibold", style: { color: theme.tokens.colors.primary }, children: theme.name }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { type: "button", className: "px-3 py-1.5 text-sm font-medium rounded-md", style: {
                                    background: theme.tokens.colors.primary,
                                    color: theme.tokens.colors.background,
                                    borderRadius: theme.tokens.components.buttonRadius,
                                }, children: "Primary" }), _jsx("div", { className: "flex-1 rounded-md p-3 text-xs", style: {
                                    background: theme.tokens.colors.surface,
                                    color: theme.tokens.colors.primary,
                                    borderRadius: theme.tokens.components.cardRadius,
                                    border: `1px solid ${(_a = theme.tokens.components.cardBorder) !== null && _a !== void 0 ? _a : "#333"}`,
                                }, children: "Card preview" })] })] })] }));
}
