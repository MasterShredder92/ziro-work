"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import * as React from "react";
import { StudioMapClassic } from "@/components/studio-map/StudioMapClassic";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
const now = new Date().toISOString();
const demoTeachers = [
    {
        id: "demo-teacher-1",
        tenant_id: DEFAULT_TENANT_ID,
        created_at: now,
        name: "Morgan Lee",
        email: "morgan@example.com",
        phone: null,
        status: "active",
        max_students: 24,
        weekly_capacity_minutes: 960,
        notes: null,
        archived_at: null,
    },
    {
        id: "demo-teacher-2",
        tenant_id: DEFAULT_TENANT_ID,
        created_at: now,
        name: "Riley Park",
        email: "riley@example.com",
        phone: null,
        status: "active",
        max_students: 18,
        weekly_capacity_minutes: 720,
        notes: null,
        archived_at: null,
    },
];
const demoStudents = {
    "demo-teacher-1": [
        { id: "demo-s-1", name: "Alex Rivera", status: "active" },
        { id: "demo-s-2", name: "Jordan Blake", status: "active" },
        { id: "demo-s-3", name: "Casey Frost", status: "paused" },
    ],
    "demo-teacher-2": [{ id: "demo-s-4", name: "Taylor Kim", status: "inactive" }],
};
export default function SandboxStudioMapPage() {
    const [expandedTeacherId, setExpandedTeacherId] = React.useState(null);
    const teachers = demoTeachers.map((teacher) => {
        var _a, _b;
        return ({
            teacher,
            studentCount: (_b = (_a = demoStudents[teacher.id]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
        });
    });
    const studentsForExpanded = expandedTeacherId && demoStudents[expandedTeacherId] ? demoStudents[expandedTeacherId] : null;
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Studio Map" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Visual QA with static fixtures (no network calls)." }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface-2)]", children: _jsx(StudioMapClassic, { studioLabel: "Studio", teachers: teachers, expandedTeacherId: expandedTeacherId, onTeacherToggle: (tid) => setExpandedTeacherId((cur) => (cur === tid ? null : tid)), studentsForExpandedTeacher: studentsForExpanded, expandedStudentsLoading: false }) })] }));
}
