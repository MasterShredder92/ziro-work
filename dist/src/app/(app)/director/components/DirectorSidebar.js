"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { MessagesBadge } from "@/components/messaging/MessagesBadge";
export const DIRECTOR_NAV = [
    { id: "overview", label: "Overview", href: "#overview", description: "KPIs and summary" },
    { id: "crm", label: "CRM", href: "/crm", description: "Contacts, students, families", scope: "crm.read" },
    { id: "leads", label: "Leads", href: "#leads", description: "Pipeline", scope: "leads.read" },
    { id: "students", label: "Students", href: "#students", description: "Enrollment", scope: "students.read" },
    { id: "teachers", label: "Teachers", href: "#teachers", description: "Load & roster", scope: "students.read" },
    { id: "schedule", label: "Schedule", href: "/schedule", description: "Calendar & events", scope: "schedule.read" },
    { id: "billing", label: "Billing", href: "/billing", description: "Revenue & AR", scope: "billing.read" },
    { id: "attendance", label: "Attendance", href: "/attendance", description: "Sessions & risk", scope: "attendance.read" },
    { id: "lesson-planner", label: "Lesson Planner", href: "/lesson-planner", description: "AI-drafted lesson plans", scope: "lessonPlanner.read" },
    { id: "inventory", label: "Inventory", href: "/inventory", description: "Assets & maintenance", scope: "inventory.read" },
    { id: "content", label: "Content Library", href: "/content", description: "Files, tags, collections", scope: "content.read" },
    { id: "files", label: "Files", href: "/files", description: "Documents, signatures, share links", scope: "files.read" },
    { id: "messages", label: "Messages", href: "/messages", description: "Inbox, threads & delivery", scope: "messages.read" },
    { id: "templates", label: "Templates", href: "/templates", description: "Communication templates", scope: "templates.read" },
    { id: "automation", label: "Automation", href: "/automation", description: "Workflows & runs", scope: "automation.read" },
    { id: "reports", label: "Reports", href: "/reports", description: "Dashboards, KPIs & exports", scope: "reports.read" },
];
export function DirectorSidebar({ locationName, allowedNavIds, }) {
    const [active, setActive] = useState("overview");
    const items = allowedNavIds
        ? DIRECTOR_NAV.filter((i) => allowedNavIds.includes(i.id))
        : DIRECTOR_NAV;
    return (_jsxs("aside", { className: "md:sticky md:top-0 md:h-[calc(100vh-52px)] w-full md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_10%)]", children: [_jsxs("div", { className: "px-5 py-4 border-b border-[var(--z-border)]", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Director" }), _jsx("div", { className: "mt-1 text-base font-semibold text-[var(--z-fg)] truncate", children: locationName })] }), _jsx("nav", { className: "flex md:block overflow-x-auto md:overflow-visible px-2 py-3 gap-1 md:gap-0 md:space-y-0.5", children: items.map((item) => {
                    const isActive = active === item.id;
                    return (_jsxs(Link, { href: item.href, onClick: () => setActive(item.id), className: clsx("block shrink-0 md:shrink md:w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal", isActive
                            ? "bg-[#00ff88]/10 text-[#00ff88]"
                            : "text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:bg-white/5"), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: item.label }), item.id === "messages" ? _jsx(MessagesBadge, {}) : null] }), item.description ? (_jsx("div", { className: clsx("hidden md:block text-[11px] mt-0.5", isActive ? "text-[#00ff88]/70" : "text-[var(--z-muted)]"), children: item.description })) : null] }, item.id));
                }) })] }));
}
