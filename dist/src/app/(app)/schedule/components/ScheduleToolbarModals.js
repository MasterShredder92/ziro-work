"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
// ─── Instrument emoji helper ──────────────────────────────────────────────────
function instrEmoji(instr) {
    if (!instr)
        return "🎵";
    if (/guitar|bass/i.test(instr))
        return "🎸";
    if (/piano|keyboard/i.test(instr))
        return "🎹";
    if (/drum|perc/i.test(instr))
        return "🥁";
    if (/violin|viola|cello|string/i.test(instr))
        return "🎻";
    if (/trumpet|horn|brass/i.test(instr))
        return "🎺";
    if (/sax|clarinet|flute|wind/i.test(instr))
        return "🎷";
    if (/voice|vocal|sing/i.test(instr))
        return "🎤";
    return "🎵";
}
function teacherInitials(t) {
    var _a, _b;
    const r = t;
    const f = typeof r.first_name === "string" ? (_a = r.first_name[0]) !== null && _a !== void 0 ? _a : "" : "";
    const l = typeof r.last_name === "string" ? (_b = r.last_name[0]) !== null && _b !== void 0 ? _b : "" : "";
    return (f + l).toUpperCase() || "T";
}
function teacherFullName(t) {
    const r = t;
    const f = typeof r.first_name === "string" ? r.first_name.trim() : "";
    const l = typeof r.last_name === "string" ? r.last_name.trim() : "";
    return `${f} ${l}`.trim() || "Teacher";
}
function studentFullName(s) {
    const r = s;
    const f = typeof r.first_name === "string" ? r.first_name.trim() : "";
    const l = typeof r.last_name === "string" ? r.last_name.trim() : "";
    return `${f} ${l}`.trim() || "Student";
}
function toMinute(t) {
    const [h = "0", m = "0"] = t.split(":");
    return Number(h) * 60 + Number(m);
}
function minuteToLabel(v) {
    const h24 = Math.floor(v / 60);
    const m = v % 60;
    const hour = h24 % 12 || 12;
    const suffix = h24 >= 12 ? "PM" : "AM";
    return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}
// ─── Modal shell ──────────────────────────────────────────────────────────────
function ModalShell({ title, subtitle, onClose, children, }) {
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm", onClick: onClose, "aria-hidden": true }), _jsxs("div", { className: "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--z-border)] bg-[#0f0f12] shadow-2xl", role: "dialog", "aria-modal": "true", children: [_jsxs("div", { className: "flex items-start justify-between border-b border-[var(--z-border)] px-5 py-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold text-[var(--z-fg)]", children: title }), subtitle && _jsx("p", { className: "mt-0.5 text-xs text-[var(--z-muted)]", children: subtitle })] }), _jsx("button", { type: "button", onClick: onClose, className: "rounded-lg p-1.5 text-[var(--z-muted)] hover:bg-white/5 hover:text-[var(--z-fg)] transition-colors", "aria-label": "Close", children: _jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4", "aria-hidden": true, children: _jsx("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })] }), _jsx("div", { className: "max-h-[70vh] overflow-y-auto px-5 py-4", children: children })] })] }));
}
export function SubModal({ locationId, selectedDate, teachers, blocks, onClose, onBlocksChange }) {
    const [subTeacherId, setSubTeacherId] = React.useState("");
    const [startTime, setStartTime] = React.useState("09:00");
    const [endTime, setEndTime] = React.useState("10:00");
    const [notes, setNotes] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [done, setDone] = React.useState(false);
    // Sub-available teachers
    const subTeachers = React.useMemo(() => {
        return teachers.filter((t) => {
            const r = t;
            return r.is_sub_available === true || r.is_active === true;
        });
    }, [teachers]);
    async function handleSubmit(e) {
        var _a, _b, _c, _d;
        e.preventDefault();
        if (!subTeacherId) {
            setError("Select a sub teacher");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const tenantId = (_b = (_a = blocks[0]) === null || _a === void 0 ? void 0 : _a.tenant_id) !== null && _b !== void 0 ? _b : "";
            const res = await fetch("/api/schedule-blocks", {
                method: "POST",
                headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                body: JSON.stringify({
                    block_date: selectedDate,
                    start_time: startTime,
                    end_time: endTime,
                    teacher_id: subTeacherId,
                    location_id: locationId,
                    block_type: "sub",
                    status: "available",
                    notes: notes || null,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => null);
                throw new Error((_c = j === null || j === void 0 ? void 0 : j.error) !== null && _c !== void 0 ? _c : `Failed (${res.status})`);
            }
            const newBlock = await res.json();
            onBlocksChange([...blocks, (_d = newBlock.data) !== null && _d !== void 0 ? _d : newBlock]);
            setDone(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create sub block");
        }
        finally {
            setSaving(false);
        }
    }
    if (done) {
        return (_jsx(ModalShell, { title: "Sub Added", onClose: onClose, children: _jsxs("div", { className: "py-6 text-center", children: [_jsx("div", { className: "mb-3 text-4xl", children: "\u2705" }), _jsxs("p", { className: "text-sm font-semibold text-[var(--z-fg)]", children: ["Sub block created for ", selectedDate, "."] }), _jsxs("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: [minuteToLabel(toMinute(startTime)), " \u2013 ", minuteToLabel(toMinute(endTime))] }), _jsx("button", { type: "button", onClick: onClose, className: "mt-4 rounded-xl border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:bg-white/5", children: "Done" })] }) }));
    }
    return (_jsx(ModalShell, { title: "+ Add Sub", subtitle: `Add a substitute teacher block on ${selectedDate}`, onClose: onClose, children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", children: error })), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Sub Teacher" }), _jsxs("select", { value: subTeacherId, onChange: (e) => setSubTeacherId(e.target.value), className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", required: true, children: [_jsx("option", { value: "", children: "Select a teacher\u2026" }), subTeachers.map((t) => (_jsxs("option", { value: t.id, children: [teacherFullName(t), t.is_sub_available ? " (Sub)" : ""] }, t.id)))] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Start Time" }), _jsx("input", { type: "time", value: startTime, onChange: (e) => setStartTime(e.target.value), className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "End Time" }), _jsx("input", { type: "time", value: endTime, onChange: (e) => setEndTime(e.target.value), className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Notes (optional)" }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, placeholder: "Any notes for the sub\u2026", className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] resize-none" })] }), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "flex-1 rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-50 hover:bg-[#00ff88]/25 transition-colors", children: saving ? "Adding…" : "Add Sub Block" })] })] }) }));
}
export function CallOutModal({ locationId, selectedDate, teachers, students, blocks, onClose, onBlocksChange, }) {
    const [calledOutTeacherId, setCalledOutTeacherId] = React.useState("");
    const [step, setStep] = React.useState("pick");
    const [assignments, setAssignments] = React.useState([]);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const studentsById = React.useMemo(() => {
        const m = new Map();
        for (const s of students)
            m.set(s.id, s);
        return m;
    }, [students]);
    const teachersById = React.useMemo(() => {
        const m = new Map();
        for (const t of teachers)
            m.set(t.id, t);
        return m;
    }, [teachers]);
    // Blocks for the called-out teacher on selected date
    const calledOutBlocks = React.useMemo(() => {
        if (!calledOutTeacherId)
            return [];
        return blocks.filter((b) => b.teacher_id === calledOutTeacherId &&
            b.block_date === selectedDate &&
            b.student_id &&
            b.block_type === "student_session");
    }, [blocks, calledOutTeacherId, selectedDate]);
    // Other teachers on the same day (potential coverage)
    const coverageTeachers = React.useMemo(() => {
        const otherIds = new Set(blocks
            .filter((b) => b.block_date === selectedDate && b.teacher_id && b.teacher_id !== calledOutTeacherId)
            .map((b) => b.teacher_id));
        return teachers.filter((t) => otherIds.has(t.id));
    }, [blocks, teachers, calledOutTeacherId, selectedDate]);
    function buildAssignments() {
        const asgn = calledOutBlocks.map((b) => {
            var _a, _b, _c, _d, _e;
            const student = b.student_id ? studentsById.get(b.student_id) : null;
            const instr = student ? String((_a = student.instrument) !== null && _a !== void 0 ? _a : "") : "";
            // Auto-suggest: first coverage teacher with matching instrument
            const suggested = coverageTeachers.find((t) => {
                const instrs = t.instruments;
                return Array.isArray(instrs) && instrs.some((i) => { var _a; return typeof i === "string" && /guitar|bass|piano|drum|violin|voice/i.test(i) && new RegExp((_a = instr.split(" ")[0]) !== null && _a !== void 0 ? _a : "", "i").test(i); });
            });
            return {
                blockId: b.id,
                studentId: (_b = b.student_id) !== null && _b !== void 0 ? _b : "",
                studentName: student ? studentFullName(student) : "Student",
                instrument: instr,
                startTime: b.start_time,
                endTime: b.end_time,
                coverTeacherId: (_e = (_c = suggested === null || suggested === void 0 ? void 0 : suggested.id) !== null && _c !== void 0 ? _c : (_d = coverageTeachers[0]) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : "",
            };
        });
        setAssignments(asgn);
        setStep("assign");
    }
    async function commitCallOut() {
        var _a, _b, _c, _d;
        setSaving(true);
        setError(null);
        try {
            const tenantId = (_b = (_a = blocks[0]) === null || _a === void 0 ? void 0 : _a.tenant_id) !== null && _b !== void 0 ? _b : "";
            // 1. Mark called-out teacher's blocks as call_out
            await Promise.all(calledOutBlocks.map((b) => fetch(`/api/schedule-blocks/${encodeURIComponent(b.id)}?skip_conflict_check=true`, {
                method: "PATCH",
                headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                body: JSON.stringify({ block_type: "call_out", is_family_callout: true, status: "available" }),
            })));
            // 2. Create new sub blocks for each assigned coverage teacher
            const created = [];
            for (const asgn of assignments) {
                if (!asgn.coverTeacherId)
                    continue;
                const res = await fetch("/api/schedule-blocks", {
                    method: "POST",
                    headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                    body: JSON.stringify({
                        block_date: selectedDate,
                        start_time: asgn.startTime,
                        end_time: asgn.endTime,
                        teacher_id: asgn.coverTeacherId,
                        location_id: locationId,
                        student_id: asgn.studentId || null,
                        block_type: "sub",
                        status: "booked",
                        original_teacher_id: calledOutTeacherId,
                        original_teacher_name: teacherFullName(teachersById.get(calledOutTeacherId)),
                        notes: `Coverage for ${teacherFullName(teachersById.get(calledOutTeacherId))} call-out`,
                    }),
                });
                if (res.ok) {
                    const j = await res.json().catch(() => null);
                    if ((_c = j === null || j === void 0 ? void 0 : j.data) !== null && _c !== void 0 ? _c : j)
                        created.push((_d = j === null || j === void 0 ? void 0 : j.data) !== null && _d !== void 0 ? _d : j);
                }
            }
            // 3. Update local state
            const updatedBlocks = blocks.map((b) => calledOutBlocks.some((co) => co.id === b.id)
                ? Object.assign(Object.assign({}, b), { block_type: "call_out", is_family_callout: true, status: "available" }) : b);
            onBlocksChange([...updatedBlocks, ...created]);
            setStep("done");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to commit call-out");
        }
        finally {
            setSaving(false);
        }
    }
    if (step === "done") {
        return (_jsx(ModalShell, { title: "Call Out Committed", onClose: onClose, children: _jsxs("div", { className: "py-6 text-center", children: [_jsx("div", { className: "mb-3 text-4xl", children: "\u2705" }), _jsxs("p", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [calledOutBlocks.length, " session", calledOutBlocks.length !== 1 ? "s" : "", " marked as call-out."] }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Coverage sub blocks created for assigned teachers." }), _jsx("button", { type: "button", onClick: onClose, className: "mt-4 rounded-xl border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:bg-white/5", children: "Done" })] }) }));
    }
    if (step === "assign") {
        return (_jsx(ModalShell, { title: "Assign Coverage", subtitle: `${calledOutBlocks.length} session${calledOutBlocks.length !== 1 ? "s" : ""} need coverage`, onClose: onClose, children: _jsxs("div", { className: "space-y-3", children: [error && (_jsx("div", { className: "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", children: error })), assignments.length === 0 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No student sessions to reassign." })) : (assignments.map((asgn, i) => (_jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: instrEmoji(asgn.instrument) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: asgn.studentName }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: [minuteToLabel(toMinute(asgn.startTime)), " \u2013 ", minuteToLabel(toMinute(asgn.endTime)), asgn.instrument ? ` · ${asgn.instrument}` : ""] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Assign to" }), _jsxs("select", { value: asgn.coverTeacherId, onChange: (e) => {
                                            const updated = [...assignments];
                                            updated[i] = Object.assign(Object.assign({}, asgn), { coverTeacherId: e.target.value });
                                            setAssignments(updated);
                                        }, className: "w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "Skip (no coverage)" }), coverageTeachers.map((t) => (_jsx("option", { value: t.id, children: teacherFullName(t) }, t.id)))] })] })] }, asgn.blockId)))), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setStep("pick"), className: "flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5", children: "\u2190 Back" }), _jsx("button", { type: "button", disabled: saving, onClick: commitCallOut, className: "flex-1 rounded-xl border border-orange-400/50 bg-orange-500/20 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-50 hover:bg-orange-500/30 transition-colors", children: saving ? "Committing…" : "Commit Call Out" })] })] }) }));
    }
    // Step: pick teacher
    return (_jsx(ModalShell, { title: "Smart Call Out", subtitle: "Who called out today? We'll find coverage automatically.", onClose: onClose, children: _jsxs("div", { className: "space-y-4", children: [error && (_jsx("div", { className: "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", children: error })), _jsx("div", { className: "space-y-2", children: teachers
                        .filter((t) => {
                        const r = t;
                        return r.is_active !== false;
                    })
                        .map((t) => {
                        const dayBlocks = blocks.filter((b) => b.teacher_id === t.id && b.block_date === selectedDate && b.student_id);
                        const isSelected = calledOutTeacherId === t.id;
                        return (_jsxs("button", { type: "button", onClick: () => setCalledOutTeacherId(t.id), className: `w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${isSelected
                                ? "border-orange-400/50 bg-orange-500/15"
                                : "border-[var(--z-border)] hover:border-[var(--z-border)] hover:bg-white/3"}`, children: [_jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--z-surface-2)] text-sm font-bold text-[var(--z-fg)]", children: teacherInitials(t) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: teacherFullName(t) }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: [dayBlocks.length, " session", dayBlocks.length !== 1 ? "s" : "", " today"] })] }), isSelected && (_jsx("svg", { viewBox: "0 0 16 16", fill: "none", className: "h-4 w-4 text-orange-400 shrink-0", "aria-hidden": true, children: _jsx("path", { d: "M3 8l4 4 6-6", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) }))] }, t.id));
                    }) }), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5", children: "Cancel" }), _jsx("button", { type: "button", disabled: !calledOutTeacherId, onClick: buildAssignments, className: "flex-1 rounded-xl border border-orange-400/50 bg-orange-500/20 px-3 py-2.5 text-sm font-semibold text-orange-200 disabled:opacity-50 hover:bg-orange-500/30 transition-colors", children: "Find Coverage \u2192" })] })] }) }));
}
export function GoVirtualModal({ locationId, selectedDate, teachers, students, blocks, onClose, onBlocksChange, }) {
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [done, setDone] = React.useState(false);
    const studentsById = React.useMemo(() => {
        const m = new Map();
        for (const s of students)
            m.set(s.id, s);
        return m;
    }, [students]);
    const targetBlocks = React.useMemo(() => blocks.filter((b) => b.block_date === selectedDate &&
        b.student_id &&
        (b.block_type === "student_session" || b.block_type === "first_day") &&
        !b.is_virtual), [blocks, selectedDate]);
    // Per-student choice: default all to "virtual"
    const [choices, setChoices] = React.useState(() => {
        const init = {};
        for (const b of targetBlocks)
            if (b.id)
                init[b.id] = "virtual";
        return init;
    });
    // Re-init when targetBlocks changes
    React.useEffect(() => {
        setChoices((prev) => {
            var _a;
            const next = {};
            for (const b of targetBlocks)
                next[b.id] = (_a = prev[b.id]) !== null && _a !== void 0 ? _a : "virtual";
            return next;
        });
    }, [targetBlocks.length]); // eslint-disable-line react-hooks/exhaustive-deps
    const virtualCount = Object.values(choices).filter((c) => c === "virtual").length;
    const notTakingCount = Object.values(choices).filter((c) => c === "not_taking").length;
    const inPersonCount = Object.values(choices).filter((c) => c === "in_person").length;
    async function handleCommit() {
        var _a, _b;
        setSaving(true);
        setError(null);
        try {
            const tenantId = (_b = (_a = blocks[0]) === null || _a === void 0 ? void 0 : _a.tenant_id) !== null && _b !== void 0 ? _b : "";
            await Promise.all(targetBlocks.map((b) => {
                var _a;
                const choice = (_a = choices[b.id]) !== null && _a !== void 0 ? _a : "virtual";
                if (choice === "virtual") {
                    return fetch(`/api/schedule-blocks/${encodeURIComponent(b.id)}?skip_conflict_check=true`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                        body: JSON.stringify({ is_virtual: true, block_type: "virtual" }),
                    });
                }
                else if (choice === "not_taking") {
                    // Mark as call_out (family callout) — still charged, just not attending
                    return fetch(`/api/schedule-blocks/${encodeURIComponent(b.id)}?skip_conflict_check=true`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                        body: JSON.stringify({ block_type: "call_out", is_family_callout: true, status: "available", notes: "Student declined virtual — still charged" }),
                    });
                }
                // in_person: no change needed
                return Promise.resolve();
            }));
            const updatedBlocks = blocks.map((b) => {
                const choice = choices[b.id];
                if (!choice || choice === "in_person")
                    return b;
                if (choice === "virtual")
                    return Object.assign(Object.assign({}, b), { is_virtual: true, block_type: "virtual" });
                if (choice === "not_taking")
                    return Object.assign(Object.assign({}, b), { block_type: "call_out", is_family_callout: true, status: "available" });
                return b;
            });
            onBlocksChange(updatedBlocks);
            setDone(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to commit");
        }
        finally {
            setSaving(false);
        }
    }
    if (done) {
        return (_jsx(ModalShell, { title: "Virtual Day Committed", onClose: onClose, children: _jsxs("div", { className: "py-6 text-center space-y-2", children: [_jsx("div", { className: "mb-3 text-4xl", children: "\uD83D\uDCBB" }), virtualCount > 0 && (_jsxs("p", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [virtualCount, " session", virtualCount !== 1 ? "s" : "", " switched to virtual."] })), notTakingCount > 0 && (_jsxs("p", { className: "text-sm text-amber-300", children: [notTakingCount, " student", notTakingCount !== 1 ? "s" : "", " marked as not attending \u2014 still charged."] })), inPersonCount > 0 && (_jsxs("p", { className: "text-sm text-emerald-300", children: [inPersonCount, " session", inPersonCount !== 1 ? "s" : "", " staying in-person."] })), _jsx("p", { className: "text-xs text-[var(--z-muted)] pt-1", children: "Google Meet links queued for virtual sessions (requires Gmail in Settings \u2192 Integrations)." }), _jsx("button", { type: "button", onClick: onClose, className: "mt-4 rounded-xl border border-[var(--z-border)] px-4 py-2 text-sm font-semibold text-[var(--z-fg)] hover:bg-white/5", children: "Done" })] }) }));
    }
    return (_jsx(ModalShell, { title: "Go Virtual", subtitle: `Choose what each student does on ${selectedDate} — all are still charged`, onClose: onClose, children: _jsxs("div", { className: "space-y-4", children: [error && (_jsx("div", { className: "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300", children: error })), targetBlocks.length === 0 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No in-person sessions found for this day." })) : (_jsxs("div", { className: "space-y-2 max-h-[50vh] overflow-y-auto pr-1", children: [_jsxs("div", { className: "flex items-center justify-between pb-1", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Set all to" }), _jsx("div", { className: "flex gap-1", children: ["virtual", "in_person", "not_taking"].map((c) => (_jsx("button", { type: "button", onClick: () => setChoices(Object.fromEntries(targetBlocks.map((b) => [b.id, c]))), className: "rounded-lg border border-[var(--z-border)] px-2 py-1 text-[10px] font-semibold text-[var(--z-muted)] hover:bg-white/5 transition-colors", children: c === "virtual" ? "💻 Virtual" : c === "in_person" ? "🏢 In-Person" : "❌ Not Taking" }, c))) })] }), targetBlocks.map((b) => {
                            var _a;
                            const student = b.student_id ? studentsById.get(b.student_id) : null;
                            const teacher = teachers.find((t) => t.id === b.teacher_id);
                            const choice = (_a = choices[b.id]) !== null && _a !== void 0 ? _a : "virtual";
                            return (_jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3", children: [_jsx("div", { className: "flex items-center justify-between gap-2 mb-2", children: _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: student ? studentFullName(student) : "—" }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: [minuteToLabel(toMinute(b.start_time)), " w/ ", teacher ? teacherFullName(teacher) : "—"] })] }) }), _jsx("div", { className: "grid grid-cols-3 gap-1", children: ([
                                            { value: "virtual", label: "💻 Virtual", activeClass: "border-sky-400/60 bg-sky-500/20 text-sky-200" },
                                            { value: "in_person", label: "🏢 In-Person", activeClass: "border-emerald-400/60 bg-emerald-500/20 text-emerald-200" },
                                            { value: "not_taking", label: "❌ Not Taking", activeClass: "border-amber-400/60 bg-amber-500/20 text-amber-200" },
                                        ]).map((opt) => (_jsx("button", { type: "button", onClick: () => setChoices((prev) => (Object.assign(Object.assign({}, prev), { [b.id]: opt.value }))), className: `rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors ${choice === opt.value
                                                ? opt.activeClass
                                                : "border-[var(--z-border)] text-[var(--z-muted)] hover:bg-white/5"}`, children: opt.label }, opt.value))) }), choice === "not_taking" && (_jsx("p", { className: "mt-1.5 text-[10px] text-amber-300/80", children: "Still charged \u2014 session logged as family call-out." }))] }, b.id));
                        })] })), _jsxs("div", { className: "rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-xs text-sky-300", children: [_jsx("span", { className: "font-semibold", children: "\uD83D\uDCBB Google Meet links" }), " will be auto-generated and emailed once Gmail is connected in ", _jsx("span", { className: "font-semibold", children: "Settings \u2192 Integrations" }), "."] }), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[var(--z-border)] px-3 py-2.5 text-sm font-semibold text-[var(--z-muted)] hover:bg-white/5", children: "Cancel" }), _jsx("button", { type: "button", disabled: saving || targetBlocks.length === 0, onClick: handleCommit, className: "flex-1 rounded-xl border border-sky-400/50 bg-sky-500/20 px-3 py-2.5 text-sm font-semibold text-sky-200 disabled:opacity-50 hover:bg-sky-500/30 transition-colors", children: saving ? "Committing…" : `Commit (${targetBlocks.length} sessions)` })] })] }) }));
}
