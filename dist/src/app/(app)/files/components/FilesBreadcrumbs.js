"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { FolderColorDot } from "./FolderColorPicker";
export function FilesBreadcrumbs({ items }) {
    if (items.length === 0)
        return null;
    return (_jsx("nav", { "aria-label": "Breadcrumb", className: "text-xs text-[var(--z-muted)]", children: _jsx("ol", { className: "flex flex-wrap items-center gap-1.5", children: items.map((c, i) => {
                var _a;
                return (_jsxs("li", { className: "flex items-center gap-1.5", children: [i > 0 ? _jsx("span", { className: "text-[var(--z-border)]", children: "/" }) : null, _jsxs("span", { className: "flex min-w-0 items-center gap-1", children: [Object.prototype.hasOwnProperty.call(c, "colorHex") ? (_jsx(FolderColorDot, { hex: (_a = c.colorHex) !== null && _a !== void 0 ? _a : null })) : null, c.href ? (_jsx(Link, { href: c.href, className: "min-w-0 truncate text-[var(--z-fg)]/80 underline-offset-2 hover:text-[var(--z-accent)] hover:underline", children: c.label })) : (_jsx("span", { className: "min-w-0 truncate font-medium text-[var(--z-fg)]", children: c.label }))] })] }, `${c.label}-${i}`));
            }) }) }));
}
