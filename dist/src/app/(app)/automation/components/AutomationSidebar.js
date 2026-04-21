"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
export const AUTOMATION_NAV = [
    {
        id: "dashboard",
        label: "Dashboard",
        href: "/automation",
        description: "KPIs & recent runs",
    },
    {
        id: "workflows",
        label: "Workflows",
        href: "/automation/workflows",
        description: "Build & manage workflows",
    },
    {
        id: "runs",
        label: "Runs",
        href: "/automation/runs",
        description: "Execution history",
    },
    {
        id: "triggers",
        label: "Trigger library",
        href: "/automation/triggers",
        description: "All trigger types",
    },
    {
        id: "actions",
        label: "Action library",
        href: "/automation/actions",
        description: "All action types",
    },
    {
        id: "rules",
        label: "Legacy rules",
        href: "/automation/rules",
        description: "Prior rules engine",
    },
];
export function AutomationSidebar({ items = AUTOMATION_NAV, }) {
    var _a;
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "";
    return (_jsxs("aside", { className: "md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]", children: [_jsxs("div", { className: "px-5 py-4 border-b border-[var(--z-border)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Automation OS" }), _jsx("div", { className: "mt-1 text-base font-semibold text-[var(--z-fg)] truncate", children: "Rules engine" })] }), _jsx("nav", { className: "flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5", children: items.map((item) => {
                    const isActive = item.href === "/automation"
                        ? pathname === "/automation"
                        : pathname.startsWith(item.href.split("#")[0]);
                    return (_jsxs(Link, { href: item.href, className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", isActive
                            ? "bg-[#00ff88]/10 text-[#00ff88]"
                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsx("div", { children: item.label }), item.description ? (_jsx("div", { className: clsx("hidden md:block text-[11px] mt-0.5", isActive ? "text-[#00ff88]/70" : "text-[var(--z-muted)]"), children: item.description })) : null] }, item.id));
                }) })] }));
}
