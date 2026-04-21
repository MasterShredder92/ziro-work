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
export const Slider = React.forwardRef(function Slider(_a, ref) {
    var { className, label, hint, id, onValueChange, onChange, readOnly } = _a, props = __rest(_a, ["className", "label", "hint", "id", "onValueChange", "onChange", "readOnly"]);
    const autoId = React.useId();
    const inputId = id !== null && id !== void 0 ? id : autoId;
    return (_jsxs("div", { className: cn("flex flex-col gap-[var(--z-space-2)]", className), children: [label ? (_jsx("label", { htmlFor: inputId, className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: label })) : null, _jsx("input", Object.assign({ ref: ref, id: inputId, type: "range", readOnly: readOnly, tabIndex: readOnly ? -1 : undefined }, props, { className: cn("h-2 w-full appearance-none rounded-full bg-[var(--z-surface-2)] accent-[var(--z-accent-color,var(--z-accent))]", readOnly ? "pointer-events-none cursor-default" : "cursor-pointer", "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_30%)] [&::-webkit-slider-thumb]:bg-[var(--z-accent-color,var(--z-accent))] [&::-webkit-slider-thumb]:shadow-[0_0_calc(10px*var(--z-neon-strength,1))_color-mix(in_oklab,var(--z-accent-color,var(--z-accent)),transparent_55%)]", focusRingClassName(), className), onChange: (e) => {
                    if (readOnly)
                        return;
                    onChange === null || onChange === void 0 ? void 0 : onChange(e);
                    const v = Number(e.target.value);
                    if (Number.isFinite(v))
                        onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(v);
                } })), hint ? _jsx("p", { className: "text-xs text-[var(--z-muted)]", children: hint }) : null] }));
});
