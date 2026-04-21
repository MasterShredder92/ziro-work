"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const STATUSES = [
    "present",
    "tardy",
    "absent",
    "no_show",
    "excused",
    "makeup",
];
/**
 * Override an existing attendance record with a new status + reason.
 * Uses PATCH /api/attendance/:recordId with an `override` payload.
 */
export function AttendanceRecordEditor({ record, onSaved, }) {
    var _a, _b, _c;
    const [status, setStatus] = useState(record.status);
    const [reasonText, setReasonText] = useState("");
    const [minutesLate, setMinutesLate] = useState((_b = (_a = record.minutes_late) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "");
    const [notes, setNotes] = useState((_c = record.notes) !== null && _c !== void 0 ? _c : "");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    async function submit(e) {
        e.preventDefault();
        if (!reasonText.trim()) {
            setError("Reason is required for overrides.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/attendance/${record.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-tenant-id": record.tenant_id,
                },
                body: JSON.stringify({
                    override: {
                        status,
                        reasonText,
                        minutesLate: minutesLate ? Number(minutesLate) : null,
                        notes: notes || null,
                    },
                }),
            });
            if (!res.ok) {
                setError(`Override failed (${res.status})`);
                return;
            }
            const json = (await res.json());
            onSaved === null || onSaved === void 0 ? void 0 : onSaved(json.data);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("form", { onSubmit: submit, className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Override record" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "block mb-1 text-[var(--z-muted)]", children: "Status" }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]", children: STATUSES.map((s) => (_jsx("option", { value: s, children: s }, s))) })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "block mb-1 text-[var(--z-muted)]", children: "Minutes late" }), _jsx("input", { type: "number", min: 0, value: minutesLate, onChange: (e) => setMinutesLate(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]" })] }), _jsxs("label", { className: "block text-sm md:col-span-2", children: [_jsx("span", { className: "block mb-1 text-[var(--z-muted)]", children: "Override reason *" }), _jsx("input", { type: "text", value: reasonText, onChange: (e) => setReasonText(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]", placeholder: "e.g. corrected after roster review" })] }), _jsxs("label", { className: "block text-sm md:col-span-2", children: [_jsx("span", { className: "block mb-1 text-[var(--z-muted)]", children: "Notes" }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 2, className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[var(--z-fg)]" })] })] }), error ? _jsx("div", { className: "text-xs text-red-400", children: error }) : null, _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "submit", disabled: loading, className: "px-3 py-1.5 rounded-md bg-[#00ffd0] text-black text-xs font-semibold uppercase tracking-wider disabled:opacity-50", children: loading ? "Saving…" : "Save override" }) })] }));
}
