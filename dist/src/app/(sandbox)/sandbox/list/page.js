"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
export default function SandboxListPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "List" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx(List, { items: [
                    {
                        id: "1",
                        title: "Student follow-up",
                        description: "Placeholder list item with icon + action slot.",
                        icon: _jsx("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-[var(--z-accent)]" }),
                        action: _jsx(Badge, { variant: "success", active: true, children: "Active" }),
                    },
                    {
                        id: "2",
                        title: "Invoice review",
                        description: "Composes cleanly inside cards and tables.",
                        icon: _jsx("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-[var(--z-warning)]" }),
                        action: _jsx(Button, { size: "sm", variant: "secondary", children: "Open" }),
                    },
                    {
                        id: "3",
                        title: "Teacher onboarding",
                        description: "No data logic—pure UI shell.",
                        icon: _jsx("span", { className: "inline-block h-2.5 w-2.5 rounded-full bg-[var(--z-danger)]" }),
                        action: _jsx(Badge, { variant: "neutral", children: "Queued" }),
                    },
                ] })] }));
}
