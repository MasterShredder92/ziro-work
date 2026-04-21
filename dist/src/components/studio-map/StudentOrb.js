"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { cn, focusRingClassName } from "@/components/ui/utils";
function isActiveStatus(status) {
    return status === "active";
}
export function StudentOrb({ student, status, className }) {
    const active = isActiveStatus(status);
    return (_jsxs(Link, { href: `/students/${student.id}`, className: cn("student-orb-ripple group relative flex min-w-[5.5rem] max-w-[7.5rem] flex-col items-center gap-[var(--z-space-2)] rounded-[var(--z-radius-lg)] border px-[var(--z-space-3)] py-[var(--z-space-3)] text-center", "transition-[transform,opacity,box-shadow,border-color] duration-[var(--z-duration-medium)] [transition-timing-function:var(--z-ease-smooth)]", focusRingClassName(), active
            ? "border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)] bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent-color)_6%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_78%),0_0_22px_color-mix(in_oklab,var(--z-accent-color),transparent_88%)]"
            : "border-[var(--z-border)] bg-[var(--z-surface-2)] opacity-55 hover:opacity-90", "hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_65%),0_0_20px_color-mix(in_oklab,var(--z-accent-color),transparent_82%)]", className), children: [_jsx("span", { className: cn("student-orb-float flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold tracking-tight", active
                    ? "border-[color-mix(in_oklab,var(--z-accent-color),transparent_35%)] bg-[var(--z-surface-2)] text-[var(--z-accent-color)] shadow-[0_0_18px_color-mix(in_oklab,var(--z-accent-color),transparent_82%)]"
                    : "border-[var(--z-border)] text-[color-mix(in_oklab,var(--z-fg),transparent_45%)]", "transition-[transform,box-shadow] duration-[var(--z-duration-fast)] [transition-timing-function:var(--z-ease-spring)] group-hover:scale-[1.06]"), "aria-hidden": true, children: student.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => { var _a; return (_a = p[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); })
                    .join("") || "?" }), _jsx("span", { className: cn("line-clamp-2 text-[0.65rem] font-semibold leading-tight", active ? "text-[var(--z-fg)]" : "text-[var(--z-muted)]"), children: student.name })] }));
}
