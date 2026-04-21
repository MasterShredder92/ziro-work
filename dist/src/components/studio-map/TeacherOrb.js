"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { StudentOrb } from "./StudentOrb";
import { InactiveClusterOrb } from "./InactiveClusterOrb";
function teacherName(teacher) {
    var _a, _b, _c;
    const explicit = ((_a = teacher.name) !== null && _a !== void 0 ? _a : "").trim();
    if (explicit)
        return explicit;
    const first = ((_b = teacher.first_name) !== null && _b !== void 0 ? _b : "").trim();
    const last = ((_c = teacher.last_name) !== null && _c !== void 0 ? _c : "").trim();
    return `${first} ${last}`.trim() || "Teacher";
}
export function TeacherOrb({ teacher, studentCount, expanded, onExpand, students, studentsLoading, className, }) {
    const displayName = teacherName(teacher);
    const activeStudents = React.useMemo(() => (students !== null && students !== void 0 ? students : []).filter((s) => s.status === "active"), [students]);
    const inactiveStudents = React.useMemo(() => (students !== null && students !== void 0 ? students : []).filter((s) => s.status !== "active"), [students]);
    return (_jsxs("div", { className: cn("flex flex-col items-center gap-[var(--z-space-3)]", className), children: [_jsxs("button", { type: "button", onClick: onExpand, className: cn("teacher-orb-magnet group flex flex-col items-center gap-[var(--z-space-2)] rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-center", focusRingClassName(), "hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]"), children: [_jsx("span", { className: cn("flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold tracking-tight", "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-accent-color)]", "transition-[transform,box-shadow,border-color] duration-[var(--z-duration-medium)] [transition-timing-function:var(--z-ease-spring)]", "group-hover:scale-[1.08] group-hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_35%)]", "group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_72%),0_0_26px_color-mix(in_oklab,var(--z-accent-color),transparent_78%)]"), "aria-hidden": true, children: displayName
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((p) => { var _a; return (_a = p[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); })
                            .join("") || "?" }), _jsx("span", { className: "max-w-[9rem] truncate text-xs font-semibold text-[var(--z-fg)]", children: displayName }), _jsxs("span", { className: "text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--z-muted)]", children: [studentCount, " students"] })] }), _jsx("div", { className: cn("z-teacher-cluster w-full max-w-[min(100%,36rem)] overflow-hidden", expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"), style: {
                    transitionProperty: "max-height, opacity",
                    transitionDuration: "var(--z-duration-medium), var(--z-duration-fast)",
                    transitionTimingFunction: "var(--z-ease-spring), var(--z-ease-smooth)",
                }, "aria-hidden": !expanded, children: _jsx("div", { className: "flex flex-col items-center gap-[var(--z-space-4)] pt-[var(--z-space-2)]", children: studentsLoading ? (_jsx("div", { className: "text-xs font-medium text-[var(--z-muted)]", children: "Loading roster\u2026" })) : students ? (students.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "No students on this roster." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex flex-wrap justify-center gap-[var(--z-space-3)]", children: activeStudents.map((s) => (_jsx(StudentOrb, { student: s, status: s.status }, s.id))) }), _jsx(InactiveClusterOrb, { count: inactiveStudents.length, students: inactiveStudents.map((s) => ({
                                    id: s.id,
                                    name: s.name,
                                    status: s.status,
                                })) })] }))) : null }) })] }));
}
