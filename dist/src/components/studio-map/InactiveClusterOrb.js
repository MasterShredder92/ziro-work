"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "@/components/ui/utils";
import { focusRingClassName } from "@/components/ui/utils";
import { StudentOrb } from "./StudentOrb";
export function InactiveClusterOrb({ count, students, className }) {
    const [open, setOpen] = React.useState(false);
    if (count <= 0)
        return null;
    return (_jsxs("div", { className: cn("flex flex-col items-center gap-[var(--z-space-3)]", className), children: [_jsxs("button", { type: "button", onClick: () => setOpen((o) => !o), className: cn("flex flex-col items-center gap-[var(--z-space-2)] rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-center transition-all hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_18px_color-mix(in_oklab,var(--z-accent),transparent_90%)]", focusRingClassName()), children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full border border-[var(--z-border)] text-xs font-bold text-[var(--z-muted)]", "aria-hidden": true, children: count }), _jsx("span", { className: "text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Inactive" })] }), open ? (_jsx("div", { className: "flex max-w-[min(100%,28rem)] flex-wrap justify-center gap-[var(--z-space-3)]", children: students.map((s) => (_jsx(StudentOrb, { student: s, status: s.status }, s.id))) })) : null] }));
}
