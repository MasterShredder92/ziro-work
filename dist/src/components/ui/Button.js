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
import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
const base = "inline-flex items-center justify-center gap-2 font-semibold select-none whitespace-nowrap transition-colors z-hover-micro disabled:opacity-50 disabled:pointer-events-none";
const radius = "rounded-[var(--z-radius-md)]";
const sizeClass = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-sm",
};
const variantClass = {
    primary: "bg-[var(--z-accent)] text-black hover:bg-[color-mix(in_oklab,var(--z-accent),white_10%)]",
    secondary: "bg-[var(--z-surface)] text-[var(--z-fg)] border border-[var(--z-border)] hover:border-[var(--z-border-2)] hover:bg-[color-mix(in_oklab,var(--z-surface),white_4%)]",
    ghost: "bg-transparent text-[var(--z-fg)] hover:bg-white/5 border border-transparent hover:border-[var(--z-border)]",
};
export const Button = React.forwardRef(function Button(_a, ref) {
    var { className, variant = "primary", size = "md", type = "button" } = _a, props = __rest(_a, ["className", "variant", "size", "type"]);
    return (_jsx("button", Object.assign({ ref: ref, type: type, className: cn(base, radius, sizeClass[size], variantClass[variant], focusRingClassName(), className) }, props)));
});
