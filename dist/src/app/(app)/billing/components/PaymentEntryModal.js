"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
const METHODS = ["manual", "card", "ach", "cash", "check", "square", "stripe"];
export function PaymentEntryModal({ invoiceId, tenantId, maxAmountCents, onClose, onRecorded, }) {
    const [amountCents, setAmountCents] = useState(maxAmountCents);
    const [method, setMethod] = useState("manual");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    async function submit() {
        var _a;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/billing/invoices/${invoiceId}/pay?tenantId=${tenantId}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    amount_cents: amountCents,
                    method,
                    reference: reference || undefined,
                    notes: notes || undefined,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `Failed (${res.status})`);
                return;
            }
            onRecorded === null || onRecorded === void 0 ? void 0 : onRecorded();
            onClose();
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: _jsxs("div", { className: "w-full max-w-md rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Record payment" }), _jsx("button", { type: "button", onClick: onClose, className: "text-sm text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2715" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Amount (cents)" }), _jsx("input", { type: "number", min: 1, max: maxAmountCents, value: amountCents, onChange: (e) => setAmountCents(Number(e.target.value)), className: "mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Method" }), _jsx("select", { value: method, onChange: (e) => setMethod(e.target.value), className: "mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]", children: METHODS.map((m) => (_jsx("option", { value: m, children: m }, m))) })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Reference (check #, txn id)" }), _jsx("input", { value: reference, onChange: (e) => setReference(e.target.value), className: "mt-1 h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "block text-sm", children: [_jsx("span", { className: "text-[var(--z-muted)]", children: "Notes" }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 3, className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200", children: error })) : null] }), _jsxs("div", { className: "mt-5 flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]", children: "Cancel" }), _jsx("button", { type: "button", onClick: submit, disabled: submitting || amountCents <= 0, className: "inline-flex h-9 items-center rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 text-sm font-semibold text-[#00ff88] disabled:opacity-40", children: submitting ? "Recording…" : "Record payment" })] })] }) }));
}
