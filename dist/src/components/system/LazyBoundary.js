"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from "react";
function DefaultFallback({ label }) {
    return (_jsx("div", { className: "flex items-center justify-center py-12 text-xs text-[#707078]", "aria-live": "polite", "aria-busy": "true", children: label ? `Loading ${label}…` : "Loading…" }));
}
/**
 * Wrap lazy-loaded heavy routes (reports, content library, files) so the
 * code-split chunk has a consistent fallback and we get a place to surface
 * slow-loads in the future.
 */
export function LazyBoundary({ children, fallback, label }) {
    return _jsx(Suspense, { fallback: fallback !== null && fallback !== void 0 ? fallback : _jsx(DefaultFallback, { label: label }), children: children });
}
