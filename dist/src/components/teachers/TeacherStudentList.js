"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";
function statusVariant(status) {
    if (status === "active")
        return "success";
    if (status === "paused")
        return "warning";
    return "neutral";
}
function nextLessonLabel(s) {
    if (s.last_attendance_at) {
        const d = new Date(s.last_attendance_at);
        if (!Number.isNaN(d.getTime())) {
            const next = new Date(d);
            next.setDate(next.getDate() + 7);
            return `Target window ${next.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
        }
    }
    if (s.enrollment_date) {
        const d = new Date(s.enrollment_date);
        if (!Number.isNaN(d.getTime())) {
            return `Enrolled ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
        }
    }
    return "Schedule pending";
}
function riskBadge(risk, stage) {
    const label = (risk === null || risk === void 0 ? void 0 : risk.trim()) || stage || "Stable";
    const lower = label.toLowerCase();
    if (lower.includes("risk") || lower.includes("churn") || lower.includes("at_risk")) {
        return _jsx(Badge, { variant: "danger", children: "At risk" });
    }
    if (lower.includes("pause") || lower.includes("watch")) {
        return _jsx(Badge, { variant: "warning", children: "Watch" });
    }
    return _jsx(Badge, { variant: "neutral", children: "Stable" });
}
export function TeacherStudentList({ students, className }) {
    const items = students.map((s) => ({
        id: s.id,
        title: (_jsx(Link, { href: `/students/${s.id}`, className: "hover:text-[var(--z-accent)]", children: s.name })),
        description: (_jsx("div", { className: "flex flex-col gap-1", children: _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: nextLessonLabel(s) }) })),
        action: (_jsxs("div", { className: "flex flex-col items-end gap-1", children: [_jsx(Badge, { variant: statusVariant(s.status), active: s.status === "active", children: s.status }), riskBadge(s.churn_risk, s.onboarding_stage)] })),
    }));
    return (_jsxs("div", { className: cn("space-y-[var(--z-space-3)]", className), children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Students" }), items.length === 0 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No students assigned." })) : (_jsx(List, { items: items }))] }));
}
