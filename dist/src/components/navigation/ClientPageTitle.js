"use client";
import { jsx as _jsx } from "react/jsx-runtime";
export function ClientPageTitle({ title }) {
    const display = typeof title === "string" ? title : "";
    return (_jsx("p", { className: "truncate text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: display }));
}
