"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageShell } from "@/components/layouts/PageShell";
import { PageTransition } from "@/components/system/PageTransition";
import { StudioMapZoom } from "@/components/studio-map/StudioMapZoom";
export function StudioMapClient({ companyName, locations, initialFocusLocationId, initialWindow, totalStudents, totalTeachers, monthlyRevenue, }) {
    const stats = [
        { label: "Locations", value: locations.length },
        totalTeachers ? { label: "Teachers", value: totalTeachers } : null,
        totalStudents ? { label: "Students", value: totalStudents } : null,
        monthlyRevenue ? { label: "Monthly", value: `$${(monthlyRevenue / 1000).toFixed(0)}K` } : null,
    ].filter(Boolean);
    return (_jsx(PageShell, { title: "Studio Map", children: _jsx(PageTransition, { children: _jsxs("div", { "data-tour": "studio-map", className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Studio Map" }), _jsx("p", { className: "text-xs text-[var(--z-muted)] mt-0.5", children: "Your organization at a glance \u2014 click a location to explore" })] }), _jsx("div", { className: "flex flex-wrap items-center gap-2", children: stats.map((stat) => (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-center", children: [_jsx("p", { className: "text-[0.65rem] font-medium uppercase tracking-[0.1em] text-[var(--z-muted)]", children: stat.label }), _jsx("p", { className: "text-sm font-bold text-[var(--z-fg)]", children: stat.value })] }, stat.label))) })] }), _jsx(StudioMapZoom, { companyName: companyName, locations: locations, scheduleWindow: initialWindow, initialFocusLocationId: initialFocusLocationId })] }) }) }));
}
