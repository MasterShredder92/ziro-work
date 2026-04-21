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
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/components/ui/utils";
const base = "inline-flex items-center gap-1 rounded-[999px] border px-2 py-0.5 text-xs font-semibold tracking-[-0.01em] select-none z-hover-micro-subtle";
const variantClass = {
    neutral: {
        base: "bg-[var(--z-surface-2)] text-[var(--z-fg)] border-[var(--z-border)]",
        active: "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_70%)]",
    },
    success: {
        base: "bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-accent)] border-[color-mix(in_oklab,var(--z-accent),transparent_70%)]",
        active: "shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_65%),0_0_18px_color-mix(in_oklab,var(--z-accent),transparent_80%)]",
    },
    warning: {
        base: "bg-[color-mix(in_oklab,var(--z-warning),transparent_92%)] text-[var(--z-warning)] border-[color-mix(in_oklab,var(--z-warning),transparent_70%)]",
        active: "shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-warning),transparent_65%),0_0_18px_color-mix(in_oklab,var(--z-warning),transparent_80%)]",
    },
    danger: {
        base: "bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] text-[var(--z-danger)] border-[color-mix(in_oklab,var(--z-danger),transparent_70%)]",
        active: "shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-danger),transparent_65%),0_0_18px_color-mix(in_oklab,var(--z-danger),transparent_80%)]",
    },
};
export function Badge(_a) {
    var { className, variant = "neutral", active = false } = _a, props = __rest(_a, ["className", "variant", "active"]);
    const v = variantClass[variant];
    return _jsx("span", Object.assign({ className: cn(base, v.base, active && v.active, className) }, props));
}
