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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cn, focusRingClassName } from "@/components/ui/utils";
export function List(_a) {
    var { items, itemClassName, className } = _a, props = __rest(_a, ["items", "itemClassName", "className"]);
    return (_jsx("div", Object.assign({ className: cn("space-y-[var(--z-space-3)]", className) }, props, { children: items.map((item) => {
            const body = (_jsxs(_Fragment, { children: [item.icon ? (_jsx("div", { className: "mt-0.5 text-[var(--z-muted)]", children: item.icon })) : null, _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: cn(item.titleLayout === "plain"
                                    ? "min-w-0"
                                    : "min-w-0 text-sm font-semibold text-[var(--z-fg)] truncate"), children: item.title }), item.description ? (_jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: item.description })) : null] }), item.action ? (_jsx("div", { className: "shrink-0", children: item.action })) : null] }));
            const rowClass = cn("flex items-start gap-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-4)] py-[var(--z-space-3)] z-hover-micro-subtle", itemClassName);
            if (item.onPress) {
                return (_jsx("button", { type: "button", onClick: item.onPress, className: cn(rowClass, "w-full text-left transition-colors", "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_65%)] hover:bg-[var(--z-surface-2)]", focusRingClassName()), children: body }, item.id));
            }
            return (_jsx("div", { className: rowClass, children: body }, item.id));
        }) })));
}
