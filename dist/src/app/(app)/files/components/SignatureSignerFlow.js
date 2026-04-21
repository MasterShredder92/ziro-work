"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { FilePreview } from "./previews/FilePreview";
import { SignatureCanvas } from "./previews/SignatureCanvas";
export function SignatureSignerFlow({ token }) {
    const [surface, setSurface] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [values, setValues] = useState({});
    const [busy, setBusy] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [declined, setDeclined] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/files/signature/${token}`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Error ${res.status}`);
            }
            const data = await res.json();
            const s = data.data;
            setSurface(s);
            const initial = {};
            for (const f of s.request.fields)
                if (f.value)
                    initial[f.id] = f.value;
            setValues(initial);
            if (s.request.status === "completed")
                setCompleted(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);
    const sendAction = async (body) => {
        var _a;
        const res = await fetch(`/api/files/signature/${token}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Error ${res.status}`);
        }
        const data = await res.json();
        return (_a = data.data) !== null && _a !== void 0 ? _a : null;
    };
    const handleFill = async (fieldId, value) => {
        try {
            setBusy(true);
            await sendAction({ action: "fill", fieldId, value });
            setValues((prev) => (Object.assign(Object.assign({}, prev), { [fieldId]: value })));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    };
    const handleSign = async () => {
        var _a;
        try {
            setBusy(true);
            // First, persist all values.
            for (const field of (_a = surface === null || surface === void 0 ? void 0 : surface.request.fields) !== null && _a !== void 0 ? _a : []) {
                const v = values[field.id];
                if (v != null) {
                    await sendAction({ action: "fill", fieldId: field.id, value: v });
                }
            }
            await sendAction({ action: "sign" });
            setCompleted(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    };
    const handleDecline = async () => {
        try {
            setBusy(true);
            await sendAction({ action: "decline", reason: declineReason || null });
            setDeclined(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "p-10 text-center text-sm text-[var(--z-muted)]", role: "status", children: "Loading\u2026" }));
    }
    if (error || !surface) {
        return (_jsx("div", { className: "rounded-md border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400", children: error !== null && error !== void 0 ? error : "Unable to load signature request." }));
    }
    const pastDue = surface.request.expiresAt != null &&
        new Date(surface.request.expiresAt).getTime() < Date.now();
    if (surface.request.status === "expired" || pastDue) {
        return (_jsxs("div", { className: "mx-auto max-w-md rounded-md border border-amber-500/40 bg-amber-500/10 p-6 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-amber-100", children: "This request has expired" }), _jsx("p", { className: "mt-2 text-sm text-amber-200/90", children: "Ask the sender for a new signature link if you still need to sign." })] }));
    }
    if (completed) {
        return (_jsxs("div", { className: "mx-auto max-w-md rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center", children: [_jsx("div", { className: "text-2xl", children: "\u2713" }), _jsx("h1", { className: "mt-2 text-lg font-semibold text-[var(--z-fg)]", children: "Thank you \u2014 your signature has been recorded." })] }));
    }
    if (declined) {
        return (_jsxs("div", { className: "mx-auto max-w-md rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Signature declined." }), _jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: "The sender has been notified." })] }));
    }
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Signature request" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: surface.request.title }), surface.request.message ? (_jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: surface.request.message })) : null, surface.signer ? (_jsxs("p", { className: "mt-2 text-xs text-[var(--z-muted)]", children: ["Signing as ", _jsx("span", { className: "text-[var(--z-fg)]", children: surface.signer.name }), " · ", surface.signer.email] })) : null] }), _jsx("section", { children: _jsx(FilePreview, { url: null, mimeType: surface.file.mimeType, name: surface.file.name }) }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Fields" }), surface.request.fields.map((field) => {
                        var _a, _b, _c;
                        return (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("label", { className: "mb-1 block text-xs font-semibold text-[var(--z-fg)]", children: [field.label, field.required ? _jsx("span", { className: "ml-1 text-red-400", children: "*" }) : null] }), field.type === "checkbox" ? (_jsx("input", { type: "checkbox", checked: values[field.id] === "true", onChange: (e) => setValues((prev) => (Object.assign(Object.assign({}, prev), { [field.id]: e.target.checked ? "true" : "false" }))), onBlur: (e) => handleFill(field.id, e.target.checked ? "true" : "false") })) : field.type === "date" ? (_jsx("input", { type: "date", value: (_a = values[field.id]) !== null && _a !== void 0 ? _a : "", onChange: (e) => setValues((prev) => (Object.assign(Object.assign({}, prev), { [field.id]: e.target.value }))), onBlur: (e) => handleFill(field.id, e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" })) : field.type === "signature-draw" || field.type === "initials" ? (_jsx(SignatureCanvas, { initialDataUrl: (_b = values[field.id]) !== null && _b !== void 0 ? _b : null, onChange: (data) => {
                                        const v = data !== null && data !== void 0 ? data : "";
                                        setValues((prev) => (Object.assign(Object.assign({}, prev), { [field.id]: v })));
                                        if (v)
                                            void handleFill(field.id, v);
                                    } })) : (_jsx("input", { type: "text", value: (_c = values[field.id]) !== null && _c !== void 0 ? _c : "", onChange: (e) => setValues((prev) => (Object.assign(Object.assign({}, prev), { [field.id]: e.target.value }))), onBlur: (e) => handleFill(field.id, e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" }))] }, field.id));
                    })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-end gap-2", children: [_jsx("div", { className: "flex-1", children: _jsx("input", { type: "text", placeholder: "Reason to decline (optional)", value: declineReason, onChange: (e) => setDeclineReason(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-xs text-[var(--z-fg)]" }) }), _jsx("button", { type: "button", onClick: handleDecline, disabled: busy, className: "rounded-md border border-[var(--z-border)] px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50", children: "Decline" }), _jsx("button", { type: "button", onClick: handleSign, disabled: busy, className: "rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50", children: busy ? "Signing…" : "Sign & Submit" })] })] }));
}
