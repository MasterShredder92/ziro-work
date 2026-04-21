"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useTransition } from "react";
const STATUSES = [
    { value: "present", label: "Present", color: "#22c55e" },
    { value: "tardy", label: "Tardy", color: "#facc15" },
    { value: "absent", label: "Absent", color: "#ef4444" },
    { value: "no_show", label: "No-show", color: "#f97316" },
    { value: "excused", label: "Excused", color: "#a78bfa" },
    { value: "makeup", label: "Make-up", color: "#06b6d4" },
];
function recordFor(records, studentId) {
    var _a;
    const related = records.filter((r) => r.student_id === studentId);
    const active = related.find((r) => !related.some((o) => o.override_of === r.id));
    return (_a = active !== null && active !== void 0 ? active : related[0]) !== null && _a !== void 0 ? _a : null;
}
export function SessionRosterGrid({ session, markedBy }) {
    const [records, setRecords] = useState(session.records);
    const [error, setError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const rosterStudents = useMemo(() => session.students, [session]);
    async function mark(studentId, status) {
        setError(null);
        const res = await fetch(`/api/attendance/session/${session.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-tenant-id": session.tenant_id,
            },
            body: JSON.stringify({
                studentId,
                status,
                markedBy: markedBy !== null && markedBy !== void 0 ? markedBy : null,
            }),
        });
        if (!res.ok) {
            setError(`Mark failed (${res.status})`);
            return;
        }
        const json = (await res.json());
        setRecords((prev) => {
            const filtered = prev.filter((r) => r.student_id !== studentId);
            return [...filtered, json.data];
        });
    }
    async function bulkMark(status) {
        setError(null);
        const entries = rosterStudents.map((s) => ({
            studentId: s.id,
            status,
            markedBy: markedBy !== null && markedBy !== void 0 ? markedBy : null,
        }));
        const res = await fetch(`/api/attendance/session/${session.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-tenant-id": session.tenant_id,
            },
            body: JSON.stringify({ entries }),
        });
        if (!res.ok) {
            setError(`Bulk mark failed (${res.status})`);
            return;
        }
        const json = (await res.json());
        setRecords(() => json.data);
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 text-xs", children: [_jsx("span", { className: "text-[var(--z-muted)] font-semibold uppercase tracking-wider", children: "Bulk:" }), STATUSES.map((s) => (_jsxs("button", { type: "button", onClick: () => startTransition(() => void bulkMark(s.value)), className: "px-2 py-1 rounded-md border border-[var(--z-border)] hover:bg-white/5", style: { color: s.color }, children: ["Mark all ", s.label.toLowerCase()] }, s.value))), error ? _jsx("span", { className: "ml-2 text-red-400", children: error }) : null, isPending ? _jsx("span", { className: "text-[var(--z-muted)]", children: "\u2026" }) : null] }), _jsx("div", { className: "overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]", children: _jsxs("tr", { className: "text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-4 py-2", children: "Student" }), _jsx("th", { className: "px-4 py-2", children: "Status" }), _jsx("th", { className: "px-4 py-2", children: "Actions" })] }) }), _jsx("tbody", { children: rosterStudents.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 3, className: "px-4 py-6 text-center text-[var(--z-muted)]", children: "No students linked to this session yet." }) })) : (rosterStudents.map((student) => {
                                var _a, _b;
                                const current = recordFor(records, student.id);
                                const name = [student.first_name, student.last_name]
                                    .filter(Boolean)
                                    .join(" ") || student.id;
                                return (_jsxs("tr", { className: "border-t border-[var(--z-border)]", children: [_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)] font-medium", children: name }), _jsx("td", { className: "px-4 py-2", children: current ? (_jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", style: {
                                                    color: (_b = (_a = STATUSES.find((x) => x.value === current.status)) === null || _a === void 0 ? void 0 : _a.color) !== null && _b !== void 0 ? _b : "#94a3b8",
                                                    backgroundColor: "rgba(255,255,255,0.05)",
                                                }, children: current.status })) : (_jsx("span", { className: "text-[var(--z-muted)] text-xs", children: "unmarked" })) }), _jsx("td", { className: "px-4 py-2", children: _jsx("div", { className: "flex flex-wrap gap-1", children: STATUSES.map((s) => (_jsx("button", { type: "button", onClick: () => startTransition(() => void mark(student.id, s.value)), className: "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-[var(--z-border)] hover:bg-white/5", style: { color: s.color }, children: s.label }, s.value))) }) })] }, student.id));
                            })) })] }) })] }));
}
