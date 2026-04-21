"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PortalSidebarNav } from "@/components/portals/PortalSidebarNav";
export const FAMILY_NAV_ITEMS = [
    { id: "overview", label: "Overview", href: "/family", icon: "▦" },
    { id: "profile", label: "Family Profile", href: "/family/profile", icon: "◎", scope: "crm.read" },
    { id: "students", label: "Students", href: "/family#students", icon: "☺", scope: "students.read" },
    { id: "schedule", label: "Schedule", href: "/schedule/family", icon: "⌚", scope: "schedule.read" },
    { id: "progress", label: "Progress", href: "/family/progress", icon: "★", scope: "family.read" },
    { id: "attendance", label: "Attendance", href: "/family/attendance", icon: "⏱", scope: "attendance.read" },
    { id: "assessments", label: "Assessments", href: "/assessments", icon: "◈", scope: "assessments.read" },
    { id: "resources", label: "Resources", href: "/content", icon: "▤", scope: "content.read" },
    { id: "automation", label: "Automations", href: "/automation", icon: "⚙", scope: "automation.read" },
    { id: "billing", label: "Billing", href: "/family#billing", icon: "$", scope: "billing.read" },
    { id: "invoices", label: "Invoices", href: "/family/invoices", icon: "◧", scope: "billing.read" },
    { id: "messages", label: "Messages", href: "/messages", icon: "✉", scope: "messages.read" },
];
export function FamilySidebar({ allowedNavIds, onNavigate, className, }) {
    return (_jsx(PortalSidebarNav, { label: "Family Portal", items: FAMILY_NAV_ITEMS, allowedNavIds: allowedNavIds, onNavigate: onNavigate, className: className }));
}
