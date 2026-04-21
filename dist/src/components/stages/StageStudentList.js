"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from "next/navigation";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
function OpenStudentButton({ id }) {
    const router = useRouter();
    return (_jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => router.push(`/students/${id}`), children: "Open student" }));
}
function digitsOnly(phone) {
    return phone.replace(/[^\d+]/g, "");
}
function riskVariant(band) {
    if (band === "high")
        return "danger";
    if (band === "medium")
        return "warning";
    return "success";
}
export function StageStudentList({ students, className }) {
    const items = students.map((s) => {
        var _a, _b;
        const phone = ((_a = s.phone) !== null && _a !== void 0 ? _a : "").trim();
        const email = ((_b = s.email) !== null && _b !== void 0 ? _b : "").trim();
        const tel = phone ? digitsOnly(phone) : "";
        const canCall = tel.length > 0;
        const canText = tel.length > 0;
        const canEmail = email.length > 0;
        return {
            id: s.id,
            title: s.name,
            description: (_jsxs("div", { className: "space-y-2", children: [s.blockers.length > 0 ? (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Needs attention" }), _jsx("ul", { className: "mt-1 space-y-1", children: s.blockers.map((b, i) => (_jsx("li", { className: "text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]", children: b }, `${s.id}-b-${i}`))) })] })) : null, _jsxs("div", { children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Do this next" }), _jsx("div", { className: "mt-1 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]", children: s.nextStep })] }), _jsxs("div", { className: "flex flex-wrap gap-2 pt-1", children: [canCall ? (_jsx("a", { className: "rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]", href: `tel:${tel}`, children: "Call" })) : null, canText ? (_jsx("a", { className: "rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]", href: `sms:${tel}`, children: "Text" })) : null, canEmail ? (_jsx("a", { className: "rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]", href: `mailto:${email}`, children: "Email" })) : null] })] })),
            action: (_jsxs("div", { className: "flex flex-col items-end gap-2 sm:flex-row sm:items-center", children: [_jsx(Badge, { variant: riskVariant(s.riskBand), active: s.riskBand !== "low", children: s.riskBand === "low" ? "On track" : s.riskBand === "medium" ? "Watch closely" : "Needs help now" }), _jsx(OpenStudentButton, { id: s.id })] })),
        };
    });
    return (_jsx("section", { className: cn("min-w-0", className), children: _jsx(List, { items: items }) }));
}
