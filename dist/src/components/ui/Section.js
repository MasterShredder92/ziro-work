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
import { Body, Caption, H3 } from "../premium/Typography";
const spacingClass = {
    tight: "gap-3",
    default: "gap-5",
    loose: "gap-7",
};
export function Section(_a) {
    var { title, description, accent = false, spacing = "default", className, children } = _a, props = __rest(_a, ["title", "description", "accent", "spacing", "className", "children"]);
    return (_jsxs("section", Object.assign({}, props, { className: cn("flex flex-col", spacingClass[spacing], className), children: [title || description ? (_jsxs("div", { className: "flex flex-col gap-1", children: [title ? (_jsxs("div", { className: "flex items-start gap-3", children: [accent ? (_jsx("span", { "aria-hidden": "true", className: "mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--z-accent)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--z-accent),transparent_86%)]" })) : null, _jsx(H3, { className: cn(accent ? "text-[var(--z-fg)]" : undefined), children: title })] })) : null, description ? (_jsx(Caption, { className: "max-w-3xl text-[color-mix(in_oklab,var(--z-fg),transparent_40%)]", children: description })) : null] })) : null, _jsx(Body, { as: "div", className: "contents", children: children })] })));
}
