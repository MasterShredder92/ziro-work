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
export const Select = React.forwardRef(function Select(_a, ref) {
    var { className, label, hint, id, options } = _a, props = __rest(_a, ["className", "label", "hint", "id", "options"]);
    const autoId = React.useId();
    const selectId = id !== null && id !== void 0 ? id : autoId;
    return (_jsxs("div", { className: cn("flex flex-col gap-[var(--z-space-2)]", className), children: [label ? (_jsx("label", { htmlFor: selectId, className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: label })) : null, _jsxs("div", { className: "relative", children: [_jsx("select", Object.assign({ ref: ref, id: selectId, className: cn("h-10 w-full appearance-none rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] pr-9 text-sm text-[var(--z-fg)]", "hover:border-[var(--z-border-2)]", focusRingClassName()) }, props, { children: options.map((o) => (_jsx("option", { value: o.value, children: o.label }, o.value))) })), _jsx("span", { "aria-hidden": true, className: "pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-r border-[var(--z-muted)]" })] }), hint ? _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: hint }) : null] }));
});
