"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function EmailIdentityTester({ tenantId, identityId, disabled, }) {
    const [to, setTo] = useState("");
    const [status, setStatus] = useState("idle");
    const [msg, setMsg] = useState(null);
    async function send() {
        var _a, _b, _c;
        if (!to.trim())
            return;
        setStatus("sending");
        setMsg(null);
        try {
            const res = await fetch("/api/branding/email-identity", {
                method: "PATCH",
                headers: { "content-type": "application/json", "x-tenant-id": tenantId },
                body: JSON.stringify({ test: { id: identityId, to: to.trim() } }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok)
                throw new Error((_a = body === null || body === void 0 ? void 0 : body.error) !== null && _a !== void 0 ? _a : "Request failed");
            setStatus("ok");
            setMsg(`Sent (stub): ${(_c = (_b = body === null || body === void 0 ? void 0 : body.data) === null || _b === void 0 ? void 0 : _b.messageId) !== null && _c !== void 0 ? _c : "ok"}`);
        }
        catch (e) {
            setStatus("err");
            setMsg(e instanceof Error ? e.message : "Error");
        }
    }
    return (_jsxs("div", { className: "flex flex-wrap items-end gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("label", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase text-[var(--z-muted)]", children: "Test recipient" }), _jsx("input", { type: "email", value: to, onChange: (e) => setTo(e.target.value), disabled: disabled, placeholder: "you@example.com", className: "min-w-[220px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1.5 text-sm" })] }), _jsx("button", { type: "button", disabled: disabled || status === "sending", onClick: send, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-sm font-semibold text-[var(--z-fg)] hover:text-[#00ff88] disabled:opacity-50", children: status === "sending" ? "Sending…" : "Send test" }), msg ? (_jsx("span", { className: `text-xs ${status === "ok" ? "text-[#00ff88]" : "text-[var(--z-danger)]"}`, children: msg })) : null] }));
}
