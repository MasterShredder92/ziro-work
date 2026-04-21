import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
function formatTimestamp(ts) {
    const d = new Date(ts);
    if (!Number.isFinite(d.getTime()))
        return "";
    return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
export function ThreadView({ thread, messages, participants, currentProfileId, }) {
    var _a;
    return (_jsxs("div", { className: "flex h-full flex-col gap-3", children: [_jsxs("header", { className: "flex flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("h1", { className: "text-base font-semibold text-[var(--z-fg)]", children: (_a = thread.subject) !== null && _a !== void 0 ? _a : "Conversation" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [participants.length, " participant", participants.length === 1 ? "" : "s", " \u00B7", " ", _jsx("span", { className: "uppercase tracking-wide", children: thread.channelType }), " ", "\u00B7 ", thread.status] })] }), _jsx(Link, { href: "/messages", className: "rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]", children: "Back" })] }), participants.length > 0 ? (_jsx("ul", { className: "flex flex-wrap gap-1", children: participants.map((p) => {
                            var _a, _b;
                            return (_jsxs("li", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: [(_b = (_a = p.display) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : p.profileId.slice(0, 8), p.role ? ` · ${p.role}` : ""] }, p.id));
                        }) })) : null] }), messages.length === 0 ? (_jsx("div", { className: "flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--z-border)] p-8 text-center text-sm text-[var(--z-muted)]", children: "No messages yet. Send the first one below." })) : (_jsx("ol", { className: "flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3", children: messages.map((msg) => {
                    const mine = msg.senderId === currentProfileId;
                    return (_jsxs("li", { className: `flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`, children: [_jsxs("div", { className: `max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${mine
                                    ? "bg-[var(--z-accent)] text-[var(--z-on-accent,white)]"
                                    : "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"}`, children: [msg.subject ? (_jsx("div", { className: "mb-1 text-[10px] uppercase tracking-wide opacity-80", children: msg.subject })) : null, _jsx("div", { className: "whitespace-pre-wrap", children: msg.body }), msg.attachments.length > 0 ? (_jsx("ul", { className: "mt-2 flex flex-col gap-1 border-t border-white/20 pt-2", children: msg.attachments.map((a) => (_jsx("li", { className: "text-[11px]", children: _jsx("a", { href: a.url, target: "_blank", rel: "noreferrer", className: "underline", children: a.name }) }, a.id))) })) : null] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: [_jsxs("span", { children: [mine ? "You" : msg.senderId.slice(0, 8), " \u00B7", " ", formatTimestamp(msg.createdAt)] }), _jsx("span", { className: "rounded-full border border-[var(--z-border)] px-1.5 py-0.5", children: msg.channelType }), _jsx("span", { className: `rounded-full px-1.5 py-0.5 ${msg.deliveryStatus === "delivered" ||
                                            msg.deliveryStatus === "read"
                                            ? "bg-green-100 text-green-800"
                                            : msg.deliveryStatus === "failed"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-amber-100 text-amber-800"}`, children: msg.deliveryStatus })] })] }, msg.id));
                }) }))] }));
}
