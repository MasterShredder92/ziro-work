"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useTransition } from "react";
import { EmailIdentityTester } from "./EmailIdentityTester";
export function EmailIdentityForm({ tenantId, identity, canWrite, }) {
    var _a, _b, _c, _d, _e;
    const [state, setState] = useState({
        id: (_a = identity === null || identity === void 0 ? void 0 : identity.id) !== null && _a !== void 0 ? _a : null,
        from_name: (_b = identity === null || identity === void 0 ? void 0 : identity.from_name) !== null && _b !== void 0 ? _b : "Workspace",
        from_email: (_c = identity === null || identity === void 0 ? void 0 : identity.from_email) !== null && _c !== void 0 ? _c : "noreply@ziro.work",
        reply_to_email: (_d = identity === null || identity === void 0 ? void 0 : identity.reply_to_email) !== null && _d !== void 0 ? _d : "",
        is_primary: (_e = identity === null || identity === void 0 ? void 0 : identity.is_primary) !== null && _e !== void 0 ? _e : true,
    });
    const [error, setError] = useState(null);
    const [savedAt, setSavedAt] = useState(null);
    const [current, setCurrent] = useState(identity);
    const [isPending, startTransition] = useTransition();
    const save = () => {
        if (!canWrite)
            return;
        setError(null);
        startTransition(async () => {
            var _a, _b, _c;
            try {
                const res = await fetch("/api/branding/email-identity", {
                    method: "PATCH",
                    headers: {
                        "content-type": "application/json",
                        "x-tenant-id": tenantId,
                    },
                    body: JSON.stringify({
                        identity: {
                            id: (_a = state.id) !== null && _a !== void 0 ? _a : undefined,
                            from_name: state.from_name,
                            from_email: state.from_email,
                            reply_to_email: state.reply_to_email || null,
                            is_primary: state.is_primary,
                        },
                    }),
                });
                const json = (await res.json().catch(() => null));
                if (!res.ok) {
                    setError((_b = json === null || json === void 0 ? void 0 : json.error) !== null && _b !== void 0 ? _b : `HTTP ${res.status}`);
                    return;
                }
                const row = (_c = json === null || json === void 0 ? void 0 : json.data) === null || _c === void 0 ? void 0 : _c.identity;
                if (row) {
                    setCurrent(row);
                    setState((s) => (Object.assign(Object.assign({}, s), { id: row.id })));
                }
                setSavedAt(new Date().toISOString());
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
            }
        });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Email identity" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "From-name, from-address & reply-to" })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]", children: error })) : null, _jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "From name" }), _jsx("input", { type: "text", value: state.from_name, onChange: (e) => setState(Object.assign(Object.assign({}, state), { from_name: e.target.value })), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "From email" }), _jsx("input", { type: "email", value: state.from_email, onChange: (e) => setState(Object.assign(Object.assign({}, state), { from_email: e.target.value })), disabled: !canWrite, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono" })] }), _jsxs("label", { className: "flex flex-col gap-1 md:col-span-2", children: [_jsx("span", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Reply-to" }), _jsx("input", { type: "email", value: state.reply_to_email, onChange: (e) => setState(Object.assign(Object.assign({}, state), { reply_to_email: e.target.value })), disabled: !canWrite, placeholder: "support@school.example.com", className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: state.is_primary, onChange: (e) => setState(Object.assign(Object.assign({}, state), { is_primary: e.target.checked })), disabled: !canWrite }), _jsx("span", { className: "text-sm text-[var(--z-fg)]", children: "Use as primary sender" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: save, disabled: !canWrite || isPending, className: "h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: isPending ? "Saving…" : "Save identity" }), savedAt ? (_jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: ["Saved ", new Date(savedAt).toLocaleTimeString()] })) : null, (current === null || current === void 0 ? void 0 : current.status) ? (_jsxs("span", { className: "ml-auto text-[11px] text-[var(--z-muted)]", children: ["Status: ", current.status] })) : null] })] }), current ? (_jsx(EmailIdentityTester, { identity: current, tenantId: tenantId, disabled: !canWrite })) : null] }));
}
