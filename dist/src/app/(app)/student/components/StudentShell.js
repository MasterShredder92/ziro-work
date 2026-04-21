"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { PortalQuickActionStrip } from "@/components/portals/PortalQuickActionStrip";
import { StudentSidebar } from "./StudentSidebar";
const STUDENT_QUICK_ACTIONS = [
    { id: "schedule", href: "/schedule/student", label: "View schedule", icon: "⌚" },
    { id: "billing", href: "/student#billing", label: "View billing", icon: "$" },
    { id: "messages", href: "/messages", label: "Message teacher", icon: "✉" },
    { id: "automation", href: "/automation", label: "Agent automations", icon: "⚙" },
    { id: "progress", href: "/student/progress", label: "View progress", icon: "★" },
    { id: "lessons", href: "/student#lessons", label: "Lessons", icon: "♪" },
];
export function StudentShell({ profile, allowedNavIds, children, }) {
    var _a;
    const [mobileOpen, setMobileOpen] = useState(false);
    const displayName = (_a = profile === null || profile === void 0 ? void 0 : profile.fullName) !== null && _a !== void 0 ? _a : "Student";
    return (_jsxs("div", { className: "flex h-full min-h-0 flex-col bg-[var(--z-bg)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]", children: [_jsxs("header", { className: "sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--z-border)] bg-[var(--z-surface)]/95 px-4 supports-[backdrop-filter]:backdrop-blur-md", children: [_jsx("button", { type: "button", onClick: () => setMobileOpen((v) => !v), className: "inline-flex h-9 w-9 items-center justify-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] text-[var(--z-fg)] lg:hidden", "aria-label": "Toggle navigation", children: "\u2630" }), _jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("span", { className: "inline-flex h-7 w-7 items-center justify-center rounded-[var(--z-radius-sm)] font-bold text-black", style: { backgroundColor: "var(--z-accent)" }, children: "Z" }), _jsx("div", { className: "truncate text-sm font-semibold text-[var(--z-fg)]", children: "ZiroWork OS \u00B7 Student" })] }), _jsxs("div", { className: "ml-auto flex items-center gap-3", children: [_jsxs("div", { className: "hidden text-right sm:block", children: [_jsx("div", { className: "truncate text-sm font-semibold text-[var(--z-fg)]", children: displayName }), (profile === null || profile === void 0 ? void 0 : profile.instrument) ? (_jsxs("div", { className: "truncate text-xs text-[var(--z-muted)]", children: [profile.instrument, profile.teacherName ? ` · ${profile.teacherName}` : ""] })) : null] }), _jsx(StudentAvatar, { profile: profile })] })] }), _jsxs("div", { className: "relative flex min-h-0 flex-1", children: [_jsx("aside", { className: `${mobileOpen
                            ? "absolute inset-y-0 left-0 z-30 w-64 max-w-[min(16rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] shadow-xl"
                            : "hidden"} shrink-0 border-r border-[var(--z-border)] bg-[var(--z-surface)] lg:static lg:block lg:w-60 lg:max-w-none lg:shadow-none`, children: _jsx(StudentSidebar, { allowedNavIds: allowedNavIds, onNavigate: () => setMobileOpen(false) }) }), mobileOpen ? (_jsx("div", { className: "absolute inset-0 z-20 bg-black/50 lg:hidden", onClick: () => setMobileOpen(false), "aria-hidden": true })) : null, _jsxs("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col", children: [_jsx(PortalQuickActionStrip, { ariaLabel: "Student quick actions", allowedNavIds: allowedNavIds, actions: STUDENT_QUICK_ACTIONS }), _jsx("main", { className: "flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 md:pb-6", children: children })] })] })] }));
}
function StudentAvatar({ profile, }) {
    return (_jsx("div", { "aria-hidden": true, className: "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_70%)] text-xs font-semibold text-[var(--z-fg)]", children: (profile === null || profile === void 0 ? void 0 : profile.initials) || "S" }));
}
