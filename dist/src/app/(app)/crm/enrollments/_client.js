"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from "next/navigation";
import { useState } from "react";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUuid(s) {
    return UUID_RE.test(s.trim());
}
export function EnrollmentFilters({ teachers, students, currentTeacherId, currentStudentId, currentStatus, currentSort, currentDir, statuses, }) {
    return (_jsxs("form", { className: "mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-3", method: "get", children: [currentSort ? (_jsx("input", { type: "hidden", name: "sort", value: currentSort })) : null, currentDir ? (_jsx("input", { type: "hidden", name: "dir", value: currentDir })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: ["Status", _jsxs("select", { name: "status", defaultValue: currentStatus !== null && currentStatus !== void 0 ? currentStatus : "", className: "h-9 min-w-[140px] rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-2 text-sm text-[var(--z-fg,#f0f0f0)]", children: [_jsx("option", { value: "", children: "Any" }), statuses.map((s) => (_jsx("option", { value: s, children: s }, s)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: ["Teacher", _jsxs("select", { name: "teacherId", defaultValue: currentTeacherId !== null && currentTeacherId !== void 0 ? currentTeacherId : "", className: "h-9 min-w-[200px] rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-2 text-sm text-[var(--z-fg,#f0f0f0)]", children: [_jsx("option", { value: "", children: "Any" }), teachers.map((t) => (_jsx("option", { value: t.id, children: t.label }, t.id)))] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: ["Student", _jsxs("select", { name: "studentId", defaultValue: currentStudentId !== null && currentStudentId !== void 0 ? currentStudentId : "", className: "h-9 min-w-[200px] rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-2 text-sm text-[var(--z-fg,#f0f0f0)]", children: [_jsx("option", { value: "", children: "Any" }), students.map((s) => (_jsx("option", { value: s.id, children: s.label }, s.id)))] })] }), _jsx("button", { type: "submit", className: "h-9 rounded-md bg-[var(--z-accent,#00ff88)]/10 px-3 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20", children: "Apply filters" })] }));
}
export function EnrollmentRowActions({ enrollmentId, status, teacherId, teachers, statuses, }) {
    const router = useRouter();
    const statusOptions = statuses.includes(status)
        ? statuses
        : [...statuses, status];
    const [st, setSt] = useState(status);
    const [tid, setTid] = useState(teacherId);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    async function save() {
        var _a;
        setBusy(true);
        setErr(null);
        try {
            const res = await fetch(`/api/crm/enrollments/${encodeURIComponent(enrollmentId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    status: st,
                    teacher_id: tid,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((_a = body.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            }
            router.refresh();
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    }
    const dirty = st !== status || tid !== teacherId;
    const teacherOptions = teachers.some((t) => t.id === teacherId)
        ? teachers
        : [...teachers, { id: teacherId, label: teacherId }];
    return (_jsxs("div", { className: "flex flex-col items-end gap-1", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-end gap-1", children: [_jsx("select", { value: st, onChange: (e) => setSt(e.target.value), className: "max-w-[120px] rounded border border-[var(--z-border,#1c1c1e)] bg-black px-1 py-1 text-[11px] text-[var(--z-fg,#f0f0f0)]", children: statusOptions.map((s) => (_jsx("option", { value: s, children: s }, s))) }), _jsx("select", { value: tid, onChange: (e) => setTid(e.target.value), className: "max-w-[140px] rounded border border-[var(--z-border,#1c1c1e)] bg-black px-1 py-1 text-[11px] text-[var(--z-fg,#f0f0f0)]", children: teacherOptions.map((t) => (_jsx("option", { value: t.id, children: t.label }, t.id))) }), _jsx("button", { type: "button", disabled: busy || !dirty, onClick: save, className: "rounded bg-[var(--z-accent,#00ff88)]/15 px-2 py-1 text-[11px] font-semibold text-[var(--z-accent,#00ff88)] disabled:opacity-40", children: busy ? "…" : "Save" })] }), err ? _jsx("span", { className: "text-[10px] text-red-400", children: err }) : null] }));
}
export function EnrollmentActions() {
    const router = useRouter();
    const [studentId, setStudentId] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);
    async function submit(e) {
        var _a;
        e.preventDefault();
        setErr(null);
        if (!isUuid(studentId)) {
            setErr("Student ID must be a valid UUID.");
            return;
        }
        if (!isUuid(teacherId)) {
            setErr("Teacher ID must be a valid UUID.");
            return;
        }
        setBusy(true);
        try {
            const res = await fetch("/api/crm/enrollments", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    studentId: studentId.trim(),
                    teacherId: teacherId.trim(),
                    startDate: startDate || undefined,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErr((_a = body.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            setStudentId("");
            setTeacherId("");
            setStartDate("");
            router.refresh();
        }
        catch (e) {
            setErr(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("form", { onSubmit: submit, className: "mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)] p-3", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: ["Student ID", _jsx("input", { required: true, value: studentId, onChange: (e) => setStudentId(e.target.value), placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", className: "h-9 w-72 rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-3 text-sm text-[var(--z-fg,#f0f0f0)]" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: ["Teacher ID", _jsx("input", { required: true, value: teacherId, onChange: (e) => setTeacherId(e.target.value), placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", className: "h-9 w-72 rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-3 text-sm text-[var(--z-fg,#f0f0f0)]" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs uppercase tracking-wider text-[var(--z-muted-2,#606068)]", children: ["Start date", _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "h-9 rounded-md border border-[var(--z-border,#1c1c1e)] bg-black px-3 text-sm text-[var(--z-fg,#f0f0f0)]" })] }), _jsx("button", { type: "submit", disabled: busy, className: "h-9 rounded-md bg-[var(--z-accent,#00ff88)]/10 px-4 text-sm font-semibold text-[var(--z-accent,#00ff88)] hover:bg-[var(--z-accent,#00ff88)]/20 disabled:opacity-50", children: busy ? "Enrolling…" : "Enroll" }), err ? _jsx("div", { className: "text-xs text-red-400", children: err }) : null] }));
}
