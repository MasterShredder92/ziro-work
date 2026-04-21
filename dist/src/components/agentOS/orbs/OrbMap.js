"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { AgentOrb } from "./AgentOrb";
import { EntityOrb } from "./EntityOrb";
/**
 * OrbMap — spatial layout:
 *   Teachers at center
 *   Students orbit the teacher they're assigned to
 *   Families orbit each of their student(s)
 *   Agents cluster in the top-right corner
 *
 * Pure CSS layout (no canvas) — SVG is only used for the connecting lines.
 * The snap-to-grid behavior is achieved by `grid-auto-flow` on teacher rows.
 */
export function OrbMap({ teachers, students, families, agentIds = [], onReassignStudent, onStudentClick, onTeacherClick, className, }) {
    const studentById = React.useMemo(() => {
        const map = new Map();
        students.forEach((s) => map.set(s.id, s));
        return map;
    }, [students]);
    const familyById = React.useMemo(() => {
        const map = new Map();
        families.forEach((f) => map.set(f.id, f));
        return map;
    }, [families]);
    const handleTeacherDrop = (teacherId) => (e) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("application/x-ziro-orb");
        if (!raw)
            return;
        try {
            const payload = JSON.parse(raw);
            if (payload.kind === "student" && typeof payload.id === "string") {
                onReassignStudent === null || onReassignStudent === void 0 ? void 0 : onReassignStudent(payload.id, teacherId);
            }
        }
        catch (_a) {
            /* ignore */
        }
    };
    return (_jsxs("div", { className: "relative w-full rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 " +
            (className !== null && className !== void 0 ? className : ""), children: [agentIds.length > 0 ? (_jsx("div", { className: "absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2", children: agentIds.map((id) => (_jsx(AgentOrb, { agentId: id, size: "lg", showRing: false }, id))) })) : null, _jsx("div", { className: "grid grid-cols-1 gap-10 lg:grid-cols-2 xl:grid-cols-3", children: teachers.map((teacher) => {
                    const teacherStudents = teacher.studentIds
                        .map((sid) => studentById.get(sid))
                        .filter((s) => !!s);
                    return (_jsxs("div", { className: "relative flex flex-col items-center gap-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx(EntityOrb, { kind: "teacher", id: teacher.id, label: teacher.name, onClick: () => onTeacherClick === null || onTeacherClick === void 0 ? void 0 : onTeacherClick(teacher.id), draggable: false, onDrop: handleTeacherDrop(teacher.id), onDragOver: (e) => e.preventDefault() }), _jsx("div", { className: "text-xs font-semibold text-[var(--z-fg)]", children: teacher.name }), _jsxs("div", { className: "text-[10px] uppercase tracking-[0.14em] text-[var(--z-muted)]", children: ["Teacher \u00B7 ", teacherStudents.length, " students"] })] }), _jsxs("div", { className: "flex flex-wrap items-start justify-center gap-5", children: [teacherStudents.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] px-3 py-2 text-[11px] text-[var(--z-muted)]", children: "Drop students here" })) : null, teacherStudents.map((student) => {
                                        var _a;
                                        const studentFamilies = ((_a = student.familyIds) !== null && _a !== void 0 ? _a : [])
                                            .map((fid) => familyById.get(fid))
                                            .filter((f) => !!f);
                                        return (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx(EntityOrb, { kind: "student", id: student.id, label: student.name, onClick: () => onStudentClick === null || onStudentClick === void 0 ? void 0 : onStudentClick(student.id) }), _jsx("div", { className: "max-w-[96px] truncate text-center text-[11px] text-[var(--z-fg)]", children: student.name }), studentFamilies.length > 0 ? (_jsx("div", { className: "flex flex-wrap items-center justify-center gap-1.5", children: studentFamilies.map((fam) => (_jsx(EntityOrb, { kind: "family", id: fam.id, label: fam.name, draggable: false }, fam.id))) })) : null] }, student.id));
                                    })] })] }, teacher.id));
                }) }), teachers.length === 0 ? (_jsx("div", { className: "py-10 text-center text-sm text-[var(--z-muted)]", children: "No teachers to map yet." })) : null] }));
}
