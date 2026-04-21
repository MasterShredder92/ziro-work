"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { TeacherHeader } from "@/components/teachers/TeacherHeader";
import { TeacherStats } from "@/components/teachers/TeacherStats";
import { TeacherStudentList } from "@/components/teachers/TeacherStudentList";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
const now = new Date().toISOString();
const teacher = {
    id: "demo-teacher-view",
    tenant_id: DEFAULT_TENANT_ID,
    created_at: now,
    name: "Skyler Monroe",
    email: "skyler@example.com",
    phone: null,
    status: "active",
    max_students: 20,
    weekly_capacity_minutes: 840,
    notes: null,
    archived_at: null,
};
const students = [
    {
        id: "demo-student-a",
        tenant_id: DEFAULT_TENANT_ID,
        created_at: now,
        family_id: null,
        teacher_id: teacher.id,
        name: "Jamie Cole",
        email: "jamie@example.com",
        phone: null,
        date_of_birth: null,
        status: "active",
        enrollment_date: now,
        onboarding_stage: "active",
        last_attendance_at: now,
        attendance_streak: 3,
        churn_risk: null,
        notes: null,
        archived_at: null,
    },
    {
        id: "demo-student-b",
        tenant_id: DEFAULT_TENANT_ID,
        created_at: now,
        family_id: null,
        teacher_id: teacher.id,
        name: "Reese Nova",
        email: null,
        phone: null,
        date_of_birth: null,
        status: "paused",
        enrollment_date: now,
        onboarding_stage: "at_risk",
        last_attendance_at: null,
        attendance_streak: 0,
        churn_risk: "churn_watch",
        notes: null,
        archived_at: null,
    },
];
export default function SandboxTeacherPage() {
    var _a;
    const rosterCount = students.length;
    const capacity = (_a = teacher.max_students) !== null && _a !== void 0 ? _a : rosterCount;
    const payrollImpact = rosterCount * 48;
    return (_jsxs("div", { className: "space-y-[var(--z-space-8)]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-xl font-extrabold", children: "Teacher view" }), _jsx(Link, { className: "text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", href: "/sandbox", children: "Back" })] }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Static composition for header, stats, and roster list." }), _jsx(TeacherHeader, { teacher: teacher, capacity: capacity, payrollImpact: payrollImpact }), _jsx(TeacherStats, { teacher: teacher, capacity: capacity, payrollImpact: payrollImpact, rosterCount: rosterCount }), _jsx(TeacherStudentList, { students: students })] }));
}
