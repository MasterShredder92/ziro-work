"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { PortalQuickActionStrip } from "@/components/portals/PortalQuickActionStrip";
import { FamilySidebar } from "./FamilySidebar";
const FAMILY_QUICK_ACTIONS = [
    { id: "invoices", href: "/family/invoices", label: "Pay invoice", icon: "$" },
    { id: "schedule", href: "/schedule/family", label: "Student schedule", icon: "⌚" },
    { id: "messages", href: "/messages", label: "Message teacher", icon: "✉" },
    { id: "automation", href: "/automation", label: "Agent automations", icon: "⚙" },
    { id: "profile", href: "/family/profile", label: "Update family info", icon: "◎" },
];
export function FamilyShell({ profile, children, allowedNavIds, }) {
    var _a;
    const [mobileOpen, setMobileOpen] = useState(false);
    return (_jsxs("div", { className: "flex h-full min-h-0 w-full flex-col bg-[color-mix(in_oklab,var(--z-bg),black_4%)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:flex-row", children: [_jsx("aside", { className: `${mobileOpen
                    ? "fixed bottom-[env(safe-area-inset-bottom)] left-[max(0px,env(safe-area-inset-left))] top-[env(safe-area-inset-top)] z-30 w-64 max-w-[min(16rem,calc(100vw-env(safe-area-inset-left)-env(safe-area-inset-right)))] border-r shadow-xl"
                    : "hidden"} md:static md:block md:max-w-none md:w-[220px] md:shrink-0 md:border-r md:border-b-0 md:shadow-none border-[var(--z-border)] bg-[var(--z-surface)]`, children: _jsx("div", { className: "sticky top-0 flex flex-col", children: _jsx(FamilySidebar, { allowedNavIds: allowedNavIds, onNavigate: () => setMobileOpen(false) }) }) }), mobileOpen ? (_jsx("div", { className: "fixed inset-0 z-20 bg-black/50 md:hidden", onClick: () => setMobileOpen(false), "aria-hidden": true })) : null, _jsxs("div", { className: "flex min-h-0 min-w-0 flex-1 flex-col", children: [_jsxs("header", { className: "sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-[var(--z-border)] bg-[var(--z-surface)]/95 px-4 supports-[backdrop-filter]:backdrop-blur-md md:px-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: () => setMobileOpen((v) => !v), className: "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--z-border)] text-[var(--z-fg)] md:hidden", "aria-label": "Toggle navigation", children: _jsx("span", { className: "text-lg leading-none", children: "\u2261" }) }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Family Dashboard" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "hidden text-right sm:block", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: (_a = profile === null || profile === void 0 ? void 0 : profile.familyName) !== null && _a !== void 0 ? _a : "Family" }), (profile === null || profile === void 0 ? void 0 : profile.email) ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: profile.email })) : null] }), _jsx(FamilyAvatar, { profile: profile })] })] }), _jsx(PortalQuickActionStrip, { ariaLabel: "Family quick actions", allowedNavIds: allowedNavIds, actions: FAMILY_QUICK_ACTIONS }), _jsx("main", { className: "min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 md:pb-6", children: children })] })] }));
}
function FamilyAvatar({ profile }) {
    var _a;
    return (_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_80%)] text-sm font-semibold text-[var(--z-accent)]", children: (_a = profile === null || profile === void 0 ? void 0 : profile.initials) !== null && _a !== void 0 ? _a : "F" }));
}
