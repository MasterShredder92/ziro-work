"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { List } from "@/components/ui/List";
import { cn } from "@/components/ui/utils/cn";
export function RoleCard({ role, permissions, className }) {
    const pages = permissions.filter((p) => p.kind === "page");
    const actions = permissions.filter((p) => p.kind === "action");
    const pageItems = pages.map((p) => ({
        id: p.id,
        title: p.label,
        action: _jsx(Badge, { variant: "success", children: "View" }),
    }));
    const actionItems = actions.map((p) => ({
        id: p.id,
        title: p.label,
        action: _jsx(Badge, { variant: "neutral", children: "Allow" }),
    }));
    return (_jsxs(Card, { variant: "elevated", padding: "lg", radius: "lg", shadow: "sm", className: cn(className), children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("div", { className: "text-lg font-semibold tracking-tight text-[var(--z-fg)]", children: role }), _jsxs(Badge, { variant: "neutral", active: true, children: [permissions.length, " grants"] })] }), _jsxs("div", { className: "mt-[var(--z-space-6)] grid grid-cols-1 gap-[var(--z-space-6)] lg:grid-cols-2", children: [_jsxs("div", { children: [_jsx("div", { className: "mb-[var(--z-space-2)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Allowed pages" }), pageItems.length ? _jsx(List, { items: pageItems }) : _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "\u2014" })] }), _jsxs("div", { children: [_jsx("div", { className: "mb-[var(--z-space-2)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Allowed actions" }), actionItems.length ? _jsx(List, { items: actionItems }) : _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "\u2014" })] })] })] }));
}
