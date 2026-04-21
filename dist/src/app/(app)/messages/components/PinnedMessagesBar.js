"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatTimestamp(iso) {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime()))
        return "";
    return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
function previewText(message) {
    const text = message.body.trim().replace(/\s+/g, " ");
    return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}
export function PinnedMessagesBar({ pinnedIds, messages, senderLabelFor, onSelectMessage, onUnpinMessage, }) {
    const byId = new Map(messages.map((message) => [message.id, message]));
    const pinnedMessages = pinnedIds
        .map((id) => byId.get(id))
        .filter((message) => Boolean(message));
    if (pinnedMessages.length === 0)
        return null;
    return (_jsxs("div", { className: "border-b border-[var(--z-border)] px-3 py-2 sm:px-4", children: [_jsx("div", { className: "hidden gap-2 overflow-x-auto pb-1 sm:flex", children: pinnedMessages.map((message) => (_jsxs("div", { className: "min-w-[240px] max-w-[280px] shrink-0 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-left hover:bg-[var(--z-surface-hover)]", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("button", { type: "button", onClick: () => onSelectMessage(message.id), className: "truncate text-xs font-semibold text-[var(--z-fg)]", children: senderLabelFor(message) }), _jsx("button", { type: "button", onClick: () => {
                                        onUnpinMessage(message.id);
                                    }, className: "rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] text-[var(--z-muted)] hover:bg-[var(--z-surface)]", children: "Unpin" })] }), _jsxs("button", { type: "button", onClick: () => onSelectMessage(message.id), className: "mt-1 w-full text-left", children: [_jsx("p", { className: "line-clamp-2 text-xs text-[var(--z-muted)]", children: previewText(message) }), _jsx("p", { className: "mt-1 text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: formatTimestamp(message.createdAt) })] })] }, message.id))) }), _jsxs("details", { className: "sm:hidden", children: [_jsxs("summary", { className: "cursor-pointer text-xs font-medium text-[var(--z-muted)]", children: ["Pinned messages (", pinnedMessages.length, ")"] }), _jsx("div", { className: "mt-2 space-y-2", children: pinnedMessages.map((message) => (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2", children: [_jsxs("button", { type: "button", onClick: () => onSelectMessage(message.id), className: "w-full text-left", children: [_jsx("p", { className: "truncate text-xs font-semibold text-[var(--z-fg)]", children: senderLabelFor(message) }), _jsx("p", { className: "mt-1 line-clamp-2 text-xs text-[var(--z-muted)]", children: previewText(message) }), _jsx("p", { className: "mt-1 text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: formatTimestamp(message.createdAt) })] }), _jsx("button", { type: "button", onClick: () => onUnpinMessage(message.id), className: "mt-2 rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] text-[var(--z-muted)]", children: "Unpin" })] }, message.id))) })] })] }));
}
