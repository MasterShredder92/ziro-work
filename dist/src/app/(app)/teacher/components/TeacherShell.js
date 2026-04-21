"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { PortalQuickActionStrip } from "@/components/portals/PortalQuickActionStrip";
import { PortalSidebarNav } from "@/components/portals/PortalSidebarNav";
const TEACHER_QUICK_ACTIONS = [
    { id: "attendance", href: "/attendance", label: "Take attendance", icon: "⏱" },
    { id: "messages", href: "/messages", label: "Message family", icon: "✉" },
    { id: "schedule", href: "/schedule", label: "Today's lessons", icon: "⌚" },
    { id: "lessons", href: "/teacher#lessons", label: "Add lesson note", icon: "✎" },
    { id: "automation", href: "/automation", label: "Open agent runs", icon: "⚙" },
];
export const TEACHER_NAV_ITEMS = [
    { id: "overview", label: "Overview", href: "/teacher" },
    { id: "profile", label: "My Profile", href: "/teacher/profile", scope: "crm.read" },
    { id: "schedule", label: "Schedule", href: "/schedule", scope: "schedule.read" },
    { id: "students", label: "Students", href: "/teacher#students", scope: "students.read" },
    { id: "lessons", label: "Lessons", href: "/teacher#lessons", scope: "schedule.read" },
    { id: "progress", label: "Progress", href: "/progress", scope: "progress.read" },
    { id: "attendance", label: "Attendance", href: "/attendance", scope: "attendance.read" },
    { id: "messages", label: "Messages", href: "/messages", scope: "messages.read" },
    { id: "assessments", label: "Assessments", href: "/assessments", scope: "assessments.read" },
    { id: "lesson-planner", label: "Lesson Planner", href: "/lesson-planner", scope: "lessonPlanner.read" },
    { id: "inventory", label: "Inventory", href: "/inventory", scope: "inventory.read" },
    { id: "content", label: "Content Library", href: "/content", scope: "content.read" },
    { id: "templates", label: "Templates", href: "/templates", scope: "templates.read" },
    { id: "automation", label: "Automations", href: "/automation", scope: "automation.read" },
];
const NAV_ITEMS = TEACHER_NAV_ITEMS;
export function TeacherShell({ profile, children, allowedNavIds, }) {
    var _a;
    const [mobileOpen, setMobileOpen] = useState(false);
    return (_jsxs("div", { className: "flex h-full min-h-0 w-full flex-col bg-[color-mix(in_oklab,var(--z-bg),black_4%)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:flex-row", children: [_jsx("aside", { className: `${mobileOpen
                    ? "fixed bottom-[env(safe-area-inset-bottom)] left-[max(0px,env(safe-area-inset-left))] top-[env(safe-area-inset-top)] z-30 w-64 max-w-[min(16rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] border-r shadow-xl"
                    : "hidden"} md:static md:block md:max-w-none md:w-[220px] shrink-0 border-b md:border-b-0 md:border-r md:shadow-none border-[var(--z-border)] bg-[var(--z-surface)]`, children: _jsx("div", { className: "sticky top-0 flex max-h-[100dvh] flex-col gap-4 overflow-y-auto px-4 py-5 md:max-h-none", children: _jsx(PortalSidebarNav, { label: "Teacher Portal", items: NAV_ITEMS, allowedNavIds: allowedNavIds, onNavigate: () => setMobileOpen(false), className: "p-0" }) }) }), _jsxs("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col", children: [_jsxs("header", { className: "flex h-14 shrink-0 items-center justify-between border-b border-[var(--z-border)] bg-[var(--z-surface)] px-4 md:px-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => setMobileOpen((v) => !v), className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--z-border)] text-[var(--z-fg)] md:hidden", "aria-label": "Toggle navigation", children: _jsx("span", { className: "text-lg leading-none", children: "\u2261" }) }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Teacher Dashboard" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "hidden text-right sm:block", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: (_a = profile === null || profile === void 0 ? void 0 : profile.fullName) !== null && _a !== void 0 ? _a : "Teacher" }), (profile === null || profile === void 0 ? void 0 : profile.email) ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: profile.email })) : null] }), _jsx(TeacherAvatar, { profile: profile })] })] }), _jsx(PortalQuickActionStrip, { ariaLabel: "Teacher quick actions", allowedNavIds: allowedNavIds, actions: TEACHER_QUICK_ACTIONS }), _jsx("main", { className: "min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 md:pb-6", children: children })] })] }));
}
function TeacherAvatar({ profile }) {
    var _a;
    if (profile === null || profile === void 0 ? void 0 : profile.photoUrl) {
        return (_jsx("img", { src: profile.photoUrl, alt: profile.fullName, className: "h-9 w-9 rounded-full border border-[var(--z-border)] object-cover" }));
    }
    return (_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-sm font-semibold text-[var(--z-accent)]", children: (_a = profile === null || profile === void 0 ? void 0 : profile.initials) !== null && _a !== void 0 ? _a : "T" }));
}
