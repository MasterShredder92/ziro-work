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
const toneClass = {
    default: "text-[var(--z-fg)]",
    muted: "text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]",
    accent: "text-[var(--z-accent)]",
    danger: "text-[var(--z-danger)]",
    warning: "text-[var(--z-warning)]",
};
const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
};
function headingBase(className) {
    return cn("font-[var(--z-font-sans)] tracking-[-0.02em] text-balance", toneClass.default, className);
}
export function H1(_a) {
    var { className, tone = "default", align = "left" } = _a, props = __rest(_a, ["className", "tone", "align"]);
    return (_jsx("h1", Object.assign({}, props, { className: cn(headingBase("text-3xl sm:text-4xl font-semibold leading-[1.05]"), toneClass[tone], alignClass[align], className) })));
}
export function H2(_a) {
    var { className, tone = "default", align = "left" } = _a, props = __rest(_a, ["className", "tone", "align"]);
    return (_jsx("h2", Object.assign({}, props, { className: cn(headingBase("text-2xl sm:text-3xl font-semibold leading-[1.1]"), toneClass[tone], alignClass[align], className) })));
}
export function H3(_a) {
    var { className, tone = "default", align = "left" } = _a, props = __rest(_a, ["className", "tone", "align"]);
    return (_jsx("h3", Object.assign({}, props, { className: cn(headingBase("text-xl sm:text-2xl font-semibold leading-[1.15]"), toneClass[tone], alignClass[align], className) })));
}
export function H4(_a) {
    var { className, tone = "default", align = "left" } = _a, props = __rest(_a, ["className", "tone", "align"]);
    return (_jsx("h4", Object.assign({}, props, { className: cn(headingBase("text-lg sm:text-xl font-semibold leading-[1.2]"), toneClass[tone], alignClass[align], className) })));
}
export function H5(_a) {
    var { className, tone = "default", align = "left" } = _a, props = __rest(_a, ["className", "tone", "align"]);
    return (_jsx("h5", Object.assign({}, props, { className: cn(headingBase("text-base sm:text-lg font-semibold leading-[1.25]"), toneClass[tone], alignClass[align], className) })));
}
export function H6(_a) {
    var { className, tone = "default", align = "left" } = _a, props = __rest(_a, ["className", "tone", "align"]);
    return (_jsx("h6", Object.assign({}, props, { className: cn(headingBase("text-sm sm:text-base font-semibold leading-[1.25]"), toneClass[tone], alignClass[align], className) })));
}
export function Body(_a) {
    var { as, className, tone = "default", align = "left" } = _a, props = __rest(_a, ["as", "className", "tone", "align"]);
    const Comp = (as !== null && as !== void 0 ? as : "p");
    return (_jsx(Comp, Object.assign({}, props, { className: cn("font-[var(--z-font-sans)] text-sm sm:text-[0.95rem] leading-relaxed tracking-[-0.01em]", toneClass[tone], alignClass[align], className) })));
}
export function Caption(_a) {
    var { as, className, tone = "muted", align = "left" } = _a, props = __rest(_a, ["as", "className", "tone", "align"]);
    const Comp = (as !== null && as !== void 0 ? as : "p");
    return (_jsx(Comp, Object.assign({}, props, { className: cn("font-[var(--z-font-sans)] text-xs leading-snug tracking-[-0.01em]", toneClass[tone], alignClass[align], className) })));
}
