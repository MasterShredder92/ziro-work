"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
export function HubLink({ label, href }) {
    return (_jsxs(Link, { href: href, className: cn("inline-flex max-w-full items-center gap-[var(--z-space-2)] rounded-[var(--z-radius-sm)] text-sm font-semibold text-[var(--z-accent)]", "underline decoration-[color-mix(in_oklab,var(--z-accent),transparent_70%)] decoration-2 underline-offset-[0.22em]", "transition-[text-decoration-color,transform,color] duration-200", "hover:text-[color-mix(in_oklab,var(--z-accent),white_12%)] hover:decoration-[var(--z-accent)]", "motion-safe:hover:translate-x-0.5 motion-reduce:hover:translate-x-0", focusRingClassName()), children: [_jsx("span", { className: "min-w-0 break-words", children: label }), _jsx(ArrowRight, { className: "h-4 w-4 shrink-0", "aria-hidden": true })] }));
}
