"use client";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils";
export function Timeline(_a) {
    var { items, className } = _a, props = __rest(_a, ["items", "className"]);
    return (_jsxs("div", Object.assign({ className: cn("relative", className) }, props, { children: [_jsx("div", { className: "pointer-events-none absolute left-[15px] top-2 bottom-2 w-px bg-[var(--z-border)] sm:left-[17px]", "aria-hidden": true }), _jsx("ul", { className: "space-y-[var(--z-space-6)]", children: items.map((item) => (_jsxs("li", { className: "relative flex gap-[var(--z-space-4)] pl-1 sm:gap-[var(--z-space-5)]", children: [_jsx("div", { className: cn("relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--z-surface-2)] text-[var(--z-muted)] sm:h-9 sm:w-9", item.accent
                                ? "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] text-[var(--z-accent)] shadow-[0_0_16px_color-mix(in_oklab,var(--z-accent),transparent_82%)]"
                                : "border-[var(--z-border)]"), children: item.icon }), _jsxs("div", { className: "min-w-0 flex-1 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-4)] py-[var(--z-space-3)]", children: [_jsxs("div", { className: "flex flex-wrap items-baseline justify-between gap-2", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: item.title }), item.meta ? (_jsx("div", { className: "text-xs font-medium text-[var(--z-muted)] tabular-nums", children: item.meta })) : null] }), item.description ? (_jsx("div", { className: "mt-1 text-xs leading-relaxed text-[var(--z-muted)]", children: item.description })) : null] })] }, item.id))) })] })));
}
