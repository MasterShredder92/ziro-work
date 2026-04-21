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
import { cn } from "./utils/cn";
import { H1, H2 } from "../premium/Typography";
export function PageHeader(_a) {
    var { title, subtitle, actions, className } = _a, props = __rest(_a, ["title", "subtitle", "actions", "className"]);
    return (_jsxs("header", Object.assign({}, props, { className: cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className), children: [_jsxs("div", { className: "min-w-0", children: [_jsx(H1, { className: "truncate", children: title }), _jsx("div", { className: "neon-ramp mt-3 h-[2px] w-14 rounded-full bg-[var(--z-accent-color)]", "aria-hidden": true }), subtitle ? (_jsx(H2, { className: "mt-2 text-base font-medium text-[color-mix(in_oklab,var(--z-fg),transparent_38%)] sm:text-lg", tone: "default", children: subtitle })) : null] }), actions ? (_jsx("div", { className: "flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end", children: actions })) : null] })));
}
