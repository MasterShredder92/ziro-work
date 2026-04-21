"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
const CATEGORY_VARIANT = {
    Onboarding: "success",
    Lifecycle: "neutral",
    Billing: "warning",
    "Win-back": "danger",
    Marketing: "neutral",
};
export function EmailTemplateCard({ title, description, category, selected, onSelect, }) {
    const body = (_jsxs(Card, { padding: "md", radius: "md", variant: "default", className: cn("h-full transition-[border-color,box-shadow] duration-200", onSelect &&
            "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_82%)]", selected &&
            "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_22px_color-mix(in_oklab,var(--z-accent),transparent_92%)]"), children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("h3", { className: "text-sm font-extrabold tracking-tight text-[var(--z-fg)]", children: title }), _jsx(Badge, { variant: CATEGORY_VARIANT[category], active: true, children: category })] }), _jsx("p", { className: "mt-[var(--z-space-3)] text-xs leading-relaxed text-[var(--z-muted)]", children: description })] }));
    if (!onSelect) {
        return _jsx("div", { className: "w-full", children: body });
    }
    return (_jsx("button", { type: "button", onClick: onSelect, className: "w-full text-left", children: body }));
}
