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
import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
export function Switch(_a) {
    var { checked, onCheckedChange, label, description, className, id } = _a, props = __rest(_a, ["checked", "onCheckedChange", "label", "description", "className", "id"]);
    const autoId = React.useId();
    const switchId = id !== null && id !== void 0 ? id : autoId;
    return (_jsxs("div", { className: cn("flex items-start justify-between gap-[var(--z-space-4)]", className), children: [_jsxs("div", { className: "min-w-0", children: [label ? (_jsx("div", { id: `${switchId}-label`, className: "text-sm font-semibold text-[var(--z-fg)]", children: label })) : null, description ? _jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: description }) : null] }), _jsx("button", Object.assign({ id: switchId, type: "button", role: "switch", "aria-checked": checked, "aria-labelledby": label ? `${switchId}-label` : undefined, onClick: () => onCheckedChange(!checked), className: cn("flex h-7 w-12 shrink-0 items-center rounded-full border px-0.5 transition-colors", focusRingClassName(), checked
                    ? "justify-end border-[color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_35%)] bg-[color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_82%)] shadow-[0_0_calc(12px*var(--z-neon-strength,1))_color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_75%)]"
                    : "justify-start border-[var(--z-border)] bg-[var(--z-surface-2)]") }, props, { children: _jsx("span", { className: cn("h-6 w-6 rounded-full border border-transparent shadow-sm transition-colors", checked ? "bg-[var(--z-accent-color,var(--z-accent))]" : "bg-[color-mix(in_oklab,var(--z-fg),transparent_25%)]") }) }))] }));
}
