"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/navigation/Sidebar";
import { TopBar } from "@/components/navigation/TopBar";
import { AnnouncementsProvider } from "@/components/announcements/AnnouncementsProvider";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { RouteLoadingBoundary } from "@/components/system/RouteLoadingBoundary";
export function CleanLayout({ children }) {
    var _a;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const pathname = usePathname();
    const isSchedulePage = (_a = pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/schedule")) !== null && _a !== void 0 ? _a : false;
    return (_jsxs("div", { className: "relative flex h-screen overflow-hidden", children: [_jsx("a", { href: "#main-content", className: "sr-only z-50 rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-[var(--z-on-accent,white)] focus:not-sr-only focus:absolute focus:left-3 focus:top-3", children: "Skip to content" }), _jsx(Sidebar, { isMobileOpen: mobileNavOpen, onClose: () => setMobileNavOpen(false) }), _jsxs("div", { className: `flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[padding] duration-300 ${isSchedulePage ? "lg:pl-[64px]" : "lg:pl-[260px]"}`, children: [_jsx(AnnouncementsProvider, {}), _jsx(Suspense, { fallback: _jsx("div", { className: "h-[52px] shrink-0 border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)]" }), children: _jsx(TopBar, { onMenuToggle: () => setMobileNavOpen((open) => !open) }) }), _jsx("main", { id: "main-content", tabIndex: -1, className: "min-h-0 flex-1 overflow-hidden", children: _jsx(ErrorBoundary, { children: _jsx(RouteLoadingBoundary, { children: children }) }) })] }), mobileNavOpen ? (_jsx("button", { type: "button", "aria-label": "Close navigation menu", className: "fixed inset-0 z-30 bg-black/50 lg:hidden", onClick: () => setMobileNavOpen(false) })) : null] }));
}
