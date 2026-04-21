"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/components/ui/utils";
function RouteSkeleton() {
    return (_jsxs("div", { className: "flex h-full min-h-0 flex-col gap-[var(--z-space-4)] p-[var(--z-space-6)]", children: [_jsx("div", { className: "h-8 w-48 max-w-[60%] animate-pulse rounded-[var(--z-radius-sm)] bg-[var(--z-surface-2)]" }), _jsx("div", { className: "grid flex-1 grid-cols-1 gap-[var(--z-space-3)] lg:grid-cols-2", children: Array.from({ length: 4 }).map((_, i) => (_jsx("div", { className: cn("min-h-[120px] animate-pulse rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)]", i === 0 && "lg:col-span-2 min-h-[180px]") }, i))) })] }));
}
export function RouteLoadingBoundary({ children }) {
    return _jsx(React.Suspense, { fallback: _jsx(RouteSkeleton, {}), children: children });
}
