"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
export function ReportsSidebar({ reports }) {
    const pathname = usePathname();
    return (_jsxs("aside", { className: "md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]", children: [_jsxs("div", { className: "px-5 py-4 border-b border-[var(--z-border)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Reporting OS" }), _jsx("div", { className: "mt-1 text-base font-semibold text-[var(--z-fg)] truncate", children: "Built-in reports" })] }), _jsxs("nav", { className: "flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5", children: [_jsxs(Link, { href: "/reports", className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", pathname === "/reports"
                            ? "bg-[#00ff88]/10 text-[#00ff88]"
                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsx("div", { children: "Dashboard" }), _jsx("div", { className: "hidden md:block text-[11px] mt-0.5 opacity-70", children: "KPIs & reports" })] }), _jsxs(Link, { href: "/reports/builder", className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/reports/builder"))
                            ? "bg-[#00ff88]/10 text-[#00ff88]"
                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsx("div", { children: "Report builder" }), _jsx("div", { className: "hidden md:block text-[11px] mt-0.5 opacity-70", children: "Compose a custom report" })] }), _jsxs(Link, { href: "/reports/widgets", className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", pathname === "/reports/widgets"
                            ? "bg-[#00ff88]/10 text-[#00ff88]"
                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsx("div", { children: "Widget library" }), _jsx("div", { className: "hidden md:block text-[11px] mt-0.5 opacity-70", children: "Reusable chart blocks" })] }), _jsxs(Link, { href: "/reports/exports", className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", (pathname === null || pathname === void 0 ? void 0 : pathname.startsWith("/reports/exports"))
                            ? "bg-[#00ff88]/10 text-[#00ff88]"
                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsx("div", { children: "Export history" }), _jsx("div", { className: "hidden md:block text-[11px] mt-0.5 opacity-70", children: "CSV \u00B7 XLSX \u00B7 PDF" })] }), reports.map((r) => {
                        const href = `/reports/${r.id}`;
                        const isActive = pathname === href;
                        return (_jsxs(Link, { href: href, className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", isActive
                                ? "bg-[#00ff88]/10 text-[#00ff88]"
                                : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsx("div", { children: r.name }), _jsx("div", { className: clsx("hidden md:block text-[11px] mt-0.5 line-clamp-2", isActive ? "text-[#00ff88]/70" : "text-[var(--z-muted)]"), children: r.description })] }, r.id));
                    })] })] }));
}
