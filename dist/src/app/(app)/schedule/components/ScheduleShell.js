"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
const NAV = [
    {
        id: "dashboard",
        label: "Schedule",
        href: "/schedule",
        icon: (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-3.5 w-3.5", "aria-hidden": true, children: [_jsx("rect", { x: "1.5", y: "2", width: "13", height: "12", rx: "1.5", stroke: "currentColor", strokeWidth: "1.4" }), _jsx("path", { d: "M1.5 5.5h13", stroke: "currentColor", strokeWidth: "1.4" }), _jsx("path", { d: "M5 1v2M11 1v2", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }), _jsx("circle", { cx: "5.5", cy: "9", r: "0.9", fill: "currentColor" }), _jsx("circle", { cx: "8", cy: "9", r: "0.9", fill: "currentColor" }), _jsx("circle", { cx: "10.5", cy: "9", r: "0.9", fill: "currentColor" })] })),
    },
    {
        id: "rooms",
        label: "Rooms",
        href: "/schedule/rooms",
        icon: (_jsxs("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-3.5 w-3.5", "aria-hidden": true, children: [_jsx("path", { d: "M2 13V5l6-3 6 3v8", stroke: "currentColor", strokeWidth: "1.4", strokeLinejoin: "round" }), _jsx("rect", { x: "5.5", y: "8", width: "5", height: "5", rx: "0.5", stroke: "currentColor", strokeWidth: "1.4" })] })),
        requiresWrite: true,
    },
];
function isActive(pathname, href) {
    if (href === "/schedule")
        return pathname === "/schedule";
    return pathname === href || pathname.startsWith(`${href}/`);
}
export function ScheduleShell({ children, tenantLabel, canWrite, }) {
    var _a;
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "/schedule";
    return (_jsxs("div", { className: "flex h-full min-h-0 flex-col", children: [_jsxs("div", { className: "shrink-0 flex items-center gap-1 overflow-x-auto border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface-2),transparent_12%)] px-3 py-2 scrollbar-none", "aria-label": "Schedule navigation", children: [NAV.filter((n) => !n.requiresWrite || canWrite).map((item) => {
                        const active = isActive(pathname, item.href);
                        return (_jsxs(Link, { href: item.href, className: clsx("flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap", active
                                ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
                                : "border-transparent text-[var(--z-muted)] hover:border-[var(--z-border)] hover:text-[var(--z-fg)]"), children: [item.icon, item.label] }, item.id));
                    }), _jsx("div", { className: "ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] pr-1", children: tenantLabel })] }), _jsx("section", { className: "min-h-0 flex-1 overflow-auto", children: _jsx("div", { className: "z-page-transition w-full", children: children }) })] }));
}
