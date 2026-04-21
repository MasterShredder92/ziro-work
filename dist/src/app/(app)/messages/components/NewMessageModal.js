"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
const channelOptions = [
    { id: "in_app", label: "In-app" },
    { id: "email", label: "Email" },
    { id: "sms", label: "SMS" },
    { id: "push", label: "Push" },
];
export function NewMessageModal({ recipients, onClose }) {
    const router = useRouter();
    const [selected, setSelected] = useState([]);
    const [subject, setSubject] = useState("");
    const [channel, setChannel] = useState("in_app");
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const dialogRef = useRef(null);
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape")
                onClose();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);
    async function handleSubmit(e) {
        var _a, _b, _c;
        e.preventDefault();
        if (submitting)
            return;
        setError(null);
        if (selected.length === 0) {
            setError("Pick at least one recipient.");
            return;
        }
        if (!body.trim()) {
            setError("Enter a message body.");
            return;
        }
        setSubmitting(true);
        try {
            const threadRes = await fetch("/api/messages/threads", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    subject: subject.trim() || null,
                    channelType: channel,
                    participantIds: selected,
                }),
            });
            if (!threadRes.ok) {
                const data = (await threadRes.json().catch(() => null));
                throw new Error((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : "Failed to create thread");
            }
            const threadData = (await threadRes.json());
            const threadId = (_b = threadData.data) === null || _b === void 0 ? void 0 : _b.id;
            if (!threadId)
                throw new Error("Thread creation returned no id");
            const msgRes = await fetch(`/api/messages/threads/${threadId}/messages`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    body: body.trim(),
                    channelType: channel,
                    subject: subject.trim() || null,
                }),
            });
            if (!msgRes.ok) {
                const data = (await msgRes.json().catch(() => null));
                throw new Error((_c = data === null || data === void 0 ? void 0 : data.error) !== null && _c !== void 0 ? _c : "Failed to send message");
            }
            router.push(`/messages/threads/${threadId}`);
            router.refresh();
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setSubmitting(false);
        }
    }
    function toggle(id) {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    }
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4", role: "dialog", "aria-modal": "true", onClick: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { ref: dialogRef, className: "flex w-full max-w-lg flex-col gap-4 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "New message" }), _jsx("button", { type: "button", onClick: onClose, className: "rounded px-2 py-1 text-sm text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", "aria-label": "Close", children: "x" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-[var(--z-muted)]", children: "Recipients" }), _jsx("div", { className: "flex max-h-36 flex-wrap gap-1 overflow-y-auto rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2", children: recipients.length === 0 ? (_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "No recipients available." })) : (recipients.map((r) => (_jsxs("button", { type: "button", onClick: () => toggle(r.id), className: `rounded-full border px-2 py-0.5 text-xs transition ${selected.includes(r.id)
                                            ? "border-[var(--z-accent)] bg-[var(--z-accent)] text-[var(--z-on-accent,white)]"
                                            : "border-[var(--z-border)] text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]"}`, children: [r.label, r.role ? ` · ${r.role}` : ""] }, r.id)))) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1 flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-[var(--z-muted)]", children: "Subject (optional)" }), _jsx("input", { value: subject, onChange: (e) => setSubject(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-[var(--z-muted)]", children: "Channel" }), _jsx("select", { value: channel, onChange: (e) => setChannel(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: channelOptions.map((opt) => (_jsx("option", { value: opt.id, children: opt.label }, opt.id))) })] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs font-medium text-[var(--z-muted)]", children: "Message" }), _jsx("textarea", { value: body, onChange: (e) => setBody(e.target.value), rows: 5, className: "w-full resize-y rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", placeholder: "Write your message..." })] }), error ? (_jsx("div", { className: "rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700", children: error })) : null, _jsxs("footer", { className: "flex items-center justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: onClose, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]", disabled: submitting, children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitting, className: "rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--z-on-accent,white)] hover:brightness-110 disabled:opacity-60", children: submitting ? "Sending..." : "Send" })] })] })] }) }));
}
