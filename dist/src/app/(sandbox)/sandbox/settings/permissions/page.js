"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { RoleCard } from "@/components/settings/RoleCard";
const matrix = [
    {
        role: "Owner",
        permissions: [
            { id: "p1", kind: "page", label: "Settings" },
            { id: "a1", kind: "action", label: "Manage billing" },
        ],
    },
    {
        role: "Teacher",
        permissions: [
            { id: "p2", kind: "page", label: "Students (assigned)" },
            { id: "a2", kind: "action", label: "Attendance" },
        ],
    },
];
export default function SandboxPermissionsSettingsPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Permissions (sandbox)" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox/settings", children: "Back" })] }), _jsx(SettingsSection, { title: "Roles", description: "Trimmed fixture for layout QA.", children: _jsx("div", { className: "space-y-[var(--z-space-4)]", children: matrix.map((m) => (_jsx(RoleCard, { role: m.role, permissions: m.permissions }, m.role))) }) })] }));
}
