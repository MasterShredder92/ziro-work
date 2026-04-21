"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function EmailIdentityTester({ identity, tenantId, disabled, }) {
    var _a;
    const [toEmail, setToEmail] = useState((_a = identity.reply_to_email) !== null && _a !== void 0 ? _a : "");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");
    const send = async () => {
        var _a, _b, _c;
        if (!toEmail) {
            setStatus("error");
            setMessage("Enter a recipient email.");
            return;
        }
        setStatus("sending");
        setMessage("");
        try {
            const res = await fetch("/api/branding/email-identity/test", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-tenant-id": tenantId,
                },
                body: JSON.stringify({
                    tenantId,
                    id: identity.id,
                    toEmail,
                }),
            });
            const json = (await res.json().catch(() => null));
            if (!res.ok) {
                setStatus("error");
                setMessage((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            setStatus("ok");
            setMessage(`Queued (${(_c = (_b = json === null || json === void 0 ? void 0 : json.data) === null || _b === void 0 ? void 0 : _b.messageId) !== null && _c !== void 0 ? _c : "stub"}).`);
        }
        catch (err) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "Failed");
        }
    };
    return (_jsxs("div", { className: "flex flex-col gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Send test email" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "email", placeholder: "recipient@example.com", value: toEmail, onChange: (e) => setToEmail(e.target.value), disabled: disabled || status === "sending", className: "h-9 flex-1 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" }), _jsx("button", { type: "button", onClick: send, disabled: disabled || status === "sending", className: "h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: status === "sending" ? "Sending…" : "Send test" })] }), message ? (_jsx("div", { className: `text-xs ${status === "ok"
                    ? "text-[#00ff88]"
                    : status === "error"
                        ? "text-[#ff3b6b]"
                        : "text-[var(--z-muted)]"}`, children: message })) : null] }));
}
