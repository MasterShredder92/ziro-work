"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function LocationsSidebar({ locations }) {
    var _a;
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "";
    return (_jsxs("aside", { className: "flex h-full w-full flex-col border-r border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsxs("header", { className: "border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Locations" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [locations.length, " active"] })] }), _jsx("nav", { className: "flex-1 overflow-y-auto", children: _jsxs("ul", { className: "divide-y divide-[var(--z-border)]", children: [_jsx("li", { children: _jsxs(Link, { href: "/locations", className: `flex flex-col px-4 py-3 text-sm transition hover:bg-[var(--z-surface-hover)] ${pathname === "/locations"
                                    ? "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"
                                    : "text-[var(--z-fg)]"}`, children: [_jsx("span", { className: "font-medium", children: "All locations" }), _jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "Overview of every studio" })] }) }), locations.map((loc) => {
                            const href = `/locations/${loc.id}`;
                            const active = pathname === href || pathname.startsWith(`${href}/`);
                            return (_jsx("li", { children: _jsxs(Link, { href: href, className: `flex flex-col px-4 py-3 text-sm transition hover:bg-[var(--z-surface-hover)] ${active
                                        ? "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"
                                        : "text-[var(--z-fg)]"}`, children: [_jsx("span", { className: "truncate font-medium", children: loc.name }), _jsx("span", { className: "truncate text-xs text-[var(--z-muted)]", children: [loc.city, loc.state].filter(Boolean).join(", ") || "—" })] }) }, loc.id));
                        })] }) })] }));
}
