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
import { cn } from "./utils/cn";
const paddingClass = {
    none: "p-0",
    sm: "p-3",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-6",
};
const radiusStyle = {
    sm: { borderRadius: "var(--z-radius-sm)" },
    md: { borderRadius: "var(--z-radius-md)" },
    lg: { borderRadius: "var(--z-radius-lg)" },
};
const shadowClass = {
    none: "shadow-none",
    sm: "shadow-[0_10px_30px_-20px_rgba(0,0,0,0.75)]",
    md: "shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)]",
};
const variantClass = {
    default: "bg-[var(--z-surface)] border border-[var(--z-border)]",
    elevated: "bg-[color-mix(in_oklab,var(--z-surface),white_2%)] border border-[color-mix(in_oklab,var(--z-border),white_4%)]",
    outline: "bg-transparent border border-[var(--z-border-2)]",
};
export function Card(_a) {
    var { variant = "default", padding = "md", radius = "md", shadow = "none", className, style, children } = _a, props = __rest(_a, ["variant", "padding", "radius", "shadow", "className", "style", "children"]);
    return (_jsx("div", Object.assign({}, props, { style: Object.assign(Object.assign({}, radiusStyle[radius]), style), className: cn("relative text-[var(--z-fg)] z-card-interact", variantClass[variant], paddingClass[padding], shadowClass[shadow], "transition-colors", className), children: children })));
}
