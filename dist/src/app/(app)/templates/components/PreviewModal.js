"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
export function PreviewModal({ open, onClose, rendered, templateId, channel, }) {
    var _a, _b;
    const [mode, setMode] = useState("desktop");
    const [target, setTarget] = useState("");
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const [sendError, setSendError] = useState(null);
    useEffect(() => {
        if (!open) {
            setSendResult(null);
            setSendError(null);
        }
    }, [open]);
    if (!open)
        return null;
    async function handleSendTest() {
        var _a, _b, _c;
        setSending(true);
        setSendResult(null);
        setSendError(null);
        try {
            const res = await fetch(`/api/templates/${templateId}/send-test`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    targetProfileId: target || undefined,
                    versionId: undefined,
                }),
            });
            if (!res.ok) {
                throw new Error(`Send failed (${res.status})`);
            }
            const payload = (await res.json().catch(() => null));
            const simulated = (_c = (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a.delivery) === null || _b === void 0 ? void 0 : _b.simulated) !== null && _c !== void 0 ? _c : false;
            if (simulated) {
                setSendResult("Rendered only (no delivery backend configured).");
            }
            else {
                setSendResult("Test message sent.");
            }
        }
        catch (err) {
            setSendError(err instanceof Error ? err.message : "Send failed");
        }
        finally {
            setSending(false);
        }
    }
    const width = mode === "mobile" ? "max-w-sm" : "max-w-3xl";
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: `w-full ${width} rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-2xl`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Preview" }), _jsxs("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: [channel ? channel.toUpperCase() : "Template", " ", rendered ? `· v${rendered.version}` : ""] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "inline-flex overflow-hidden rounded-md border border-[var(--z-border)]", children: [_jsx("button", { type: "button", onClick: () => setMode("mobile"), className: `px-2 py-1 text-xs ${mode === "mobile"
                                                ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                                                : "text-[var(--z-fg)]/80"}`, children: "Mobile" }), _jsx("button", { type: "button", onClick: () => setMode("desktop"), className: `px-2 py-1 text-xs ${mode === "desktop"
                                                ? "bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] text-[var(--z-accent)]"
                                                : "text-[var(--z-fg)]/80"}`, children: "Desktop" })] }), _jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-xs text-[var(--z-fg)]", children: "Close" })] })] }), _jsxs("div", { className: "mt-3 rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_4%)] p-3", children: [(rendered === null || rendered === void 0 ? void 0 : rendered.subject) ? (_jsxs("div", { className: "mb-2", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Subject" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: rendered.subject })] })) : null, _jsx("pre", { className: "whitespace-pre-wrap break-words font-mono text-sm leading-6 text-[var(--z-fg)]", children: (_a = rendered === null || rendered === void 0 ? void 0 : rendered.body) !== null && _a !== void 0 ? _a : "(nothing rendered)" }), ((_b = rendered === null || rendered === void 0 ? void 0 : rendered.missingMergeFields) === null || _b === void 0 ? void 0 : _b.length) ? (_jsxs("div", { className: "mt-3 rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]", children: ["Missing fields:", " ", rendered.missingMergeFields.map((f) => (_jsx("code", { className: "mr-1", children: `{{${f}}}` }, f)))] })) : null] }), _jsxs("div", { className: "mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between", children: [_jsxs("label", { className: "flex flex-1 items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsx("span", { children: "Test target profile ID" }), _jsx("input", { value: target, onChange: (e) => setTarget(e.target.value), placeholder: "Leave blank to send to yourself", className: "flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-xs text-[var(--z-fg)]" })] }), _jsx("button", { type: "button", onClick: handleSendTest, disabled: sending, className: "rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_85%)] px-3 py-1.5 text-xs font-semibold text-[var(--z-accent)] disabled:opacity-50", children: sending ? "Sending…" : "Send test" })] }), sendResult ? (_jsx("div", { className: "mt-2 rounded-md border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] p-2 text-xs text-[var(--z-accent)]", children: sendResult })) : null, sendError ? (_jsx("div", { className: "mt-2 rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_55%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-2 text-xs text-[var(--z-danger)]", children: sendError })) : null] }) }));
}
