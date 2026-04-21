"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { EmailIdentityTester } from "./EmailIdentityTester";
const emptyIdentity = () => ({
    id: "new",
    tenant_id: "",
    from_name: "Workspace",
    from_email: "noreply@ziro.work",
    reply_to_email: null,
    status: "pending",
    verified_at: null,
    last_tested_at: null,
    failure_reason: null,
    is_primary: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
});
export function EmailIdentityClient({ tenantId, canWrite, identity, }) {
    var _a;
    const base = identity !== null && identity !== void 0 ? identity : emptyIdentity();
    const [fromName, setFromName] = useState(base.from_name);
    const [fromEmail, setFromEmail] = useState(base.from_email);
    const [replyTo, setReplyTo] = useState((_a = base.reply_to_email) !== null && _a !== void 0 ? _a : "");
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const qs = useMemo(() => `tenantId=${encodeURIComponent(tenantId)}`, [tenantId]);
    async function save() {
        var _a;
        if (!canWrite)
            return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/branding/email-identity?${qs}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    id: (identity === null || identity === void 0 ? void 0 : identity.id) !== "new" ? identity === null || identity === void 0 ? void 0 : identity.id : undefined,
                    from_name: fromName,
                    from_email: fromEmail,
                    reply_to_email: replyTo.trim() || null,
                    is_primary: true,
                }),
            });
            const j = (await res.json().catch(() => null));
            if (!res.ok) {
                setMsg((_a = j === null || j === void 0 ? void 0 : j.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            setMsg("Saved.");
        }
        finally {
            setBusy(false);
        }
    }
    const forTester = Object.assign(Object.assign({}, base), { from_name: fromName, from_email: fromEmail, reply_to_email: replyTo.trim() || null, id: (identity === null || identity === void 0 ? void 0 : identity.id) && identity.id !== "new" ? identity.id : base.id });
    return (_jsxs("div", { className: "space-y-4 max-w-lg", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: ["From name", _jsx("input", { value: fromName, onChange: (e) => setFromName(e.target.value), disabled: !canWrite || busy, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: ["From address", _jsx("input", { type: "email", value: fromEmail, onChange: (e) => setFromEmail(e.target.value), disabled: !canWrite || busy, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: ["Reply-to (optional)", _jsx("input", { type: "email", value: replyTo, onChange: (e) => setReplyTo(e.target.value), disabled: !canWrite || busy, className: "h-9 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsx("button", { type: "button", disabled: !canWrite || busy, onClick: save, className: "rounded-[var(--z-radius-md)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] disabled:opacity-50", children: busy ? "Saving…" : "Save" }), msg ? _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: msg }) : null, forTester.id !== "new" ? (_jsx(EmailIdentityTester, { identity: forTester, tenantId: tenantId, disabled: !canWrite || busy })) : (_jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Save once to enable test email." }))] }));
}
