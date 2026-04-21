"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function CheckoutForm({ itemId, apiPath = "/inventory/api/checkout", defaultProfileId, onSuccess, }) {
    const [profileId, setProfileId] = useState(defaultProfileId !== null && defaultProfileId !== void 0 ? defaultProfileId : "");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const submit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        if (!profileId.trim()) {
            setError("Profile is required.");
            return;
        }
        setPending(true);
        try {
            const res = await fetch(apiPath, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    itemId,
                    profileId: profileId.trim(),
                    dueDate: dueDate || undefined,
                    notes: notes || undefined,
                }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Checkout failed (${res.status})`);
            }
            setSuccess("Checkout recorded.");
            setProfileId(defaultProfileId !== null && defaultProfileId !== void 0 ? defaultProfileId : "");
            setDueDate("");
            setNotes("");
            onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Checkout failed.");
        }
        finally {
            setPending(false);
        }
    };
    return (_jsxs("form", { onSubmit: submit, className: "space-y-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "New checkout" }), _jsx("p", { className: "mt-0.5 text-xs text-[var(--z-muted)]", children: "Record that this item has been handed off to a teacher or student." })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Profile ID" }), _jsx("input", { className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: profileId, onChange: (e) => setProfileId(e.target.value), placeholder: "profile-uuid", required: true })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Due date" }), _jsx("input", { type: "date", className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", value: dueDate, onChange: (e) => setDueDate(e.target.value) })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Notes" }), _jsx("textarea", { className: "mt-1 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]", rows: 2, value: notes, onChange: (e) => setNotes(e.target.value) })] }), _jsx("button", { type: "submit", disabled: pending, className: "rounded-md bg-[#00ff88]/20 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/30 disabled:opacity-60", children: pending ? "Checking out…" : "Check out" }), error ? (_jsx("div", { className: "text-xs text-rose-300", children: error })) : null, success ? (_jsx("div", { className: "text-xs text-[#00ff88]", children: success })) : null] }));
}
