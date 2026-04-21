"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const KINDS = [
    "inspection",
    "repair",
    "cleaning",
    "tuning",
    "calibration",
    "replacement_part",
    "other",
];
const STATUSES = [
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
];
export function MaintenanceForm({ itemId, apiPath = "/inventory/api/maintenance", onSuccess, }) {
    const [summary, setSummary] = useState("");
    const [kind, setKind] = useState("inspection");
    const [status, setStatus] = useState("scheduled");
    const [scheduledFor, setScheduledFor] = useState("");
    const [cost, setCost] = useState("");
    const [vendor, setVendor] = useState("");
    const [notes, setNotes] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const submit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        if (!summary.trim()) {
            setError("Summary is required.");
            return;
        }
        setPending(true);
        try {
            const res = await fetch(apiPath, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    itemId,
                    payload: {
                        summary: summary.trim(),
                        kind,
                        status,
                        scheduledFor: scheduledFor || undefined,
                        cost: cost ? Number(cost) : undefined,
                        vendor: vendor || undefined,
                        notes: notes || undefined,
                    },
                }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Maintenance failed (${res.status})`);
            }
            setSuccess("Maintenance logged.");
            setSummary("");
            setNotes("");
            setCost("");
            setVendor("");
            setScheduledFor("");
            setKind("inspection");
            setStatus("scheduled");
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Maintenance failed.");
        }
        finally {
            setPending(false);
        }
    };
    return (_jsxs("form", { onSubmit: submit, className: "space-y-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Log maintenance" }), _jsx("p", { className: "mt-0.5 text-xs text-[var(--z-muted)]", children: "Record inspections, repairs, tuning, and other service events." })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Summary" }), _jsx("input", { className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: summary, onChange: (e) => setSummary(e.target.value), placeholder: "E.g., Replaced bridge on cello #3", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Kind" }), _jsx("select", { className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: kind, onChange: (e) => setKind(e.target.value), children: KINDS.map((k) => (_jsx("option", { value: k, children: k.replace(/_/g, " ") }, k))) })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Status" }), _jsx("select", { className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: status, onChange: (e) => setStatus(e.target.value), children: STATUSES.map((s) => (_jsx("option", { value: s, children: s.replace(/_/g, " ") }, s))) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Scheduled for" }), _jsx("input", { type: "date", className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: scheduledFor, onChange: (e) => setScheduledFor(e.target.value) })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Cost (USD)" }), _jsx("input", { type: "number", step: "0.01", className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: cost, onChange: (e) => setCost(e.target.value) })] })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Vendor" }), _jsx("input", { className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: vendor, onChange: (e) => setVendor(e.target.value) })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Notes" }), _jsx("textarea", { className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", rows: 2, value: notes, onChange: (e) => setNotes(e.target.value) })] }), _jsx("button", { type: "submit", disabled: pending, className: "rounded-md bg-[#00ff88]/20 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/30 disabled:opacity-60", children: pending ? "Saving…" : "Log maintenance" }), error ? (_jsx("div", { className: "text-xs text-rose-300", children: error })) : null, success ? (_jsx("div", { className: "text-xs text-[#00ff88]", children: success })) : null] }));
}
