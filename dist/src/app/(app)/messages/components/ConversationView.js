import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function ConversationView({ detail, currentProfileId, }) {
    var _a, _b, _c, _d;
    if (!detail) {
        return (_jsx("div", { className: "flex h-full items-center justify-center p-8 text-center text-sm text-[var(--z-muted)]", children: "Select a thread on the left to view the conversation." }));
    }
    const { thread, messages } = detail;
    const title = (_c = (_b = (_a = thread.counterpart) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : thread.subject) !== null && _c !== void 0 ? _c : "Conversation";
    return (_jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("header", { className: "flex flex-col gap-1 border-b border-[var(--z-border)] bg-[var(--z-surface)] px-5 py-4", children: [_jsx("h1", { className: "text-base font-semibold text-[var(--z-fg)]", children: title }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [detail.participants.length, " participant", detail.participants.length === 1 ? "" : "s", ((_d = thread.counterpart) === null || _d === void 0 ? void 0 : _d.role) ? ` · ${thread.counterpart.role}` : ""] })] }), messages.length === 0 ? (_jsx("div", { className: "flex flex-1 items-center justify-center p-8 text-center text-sm text-[var(--z-muted)]", children: "No messages yet. Send the first one below." })) : (_jsx("ol", { className: "flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4", children: messages.map((msg) => {
                    var _a;
                    const mine = msg.authorProfileId === currentProfileId;
                    return (_jsxs("li", { className: `flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`, children: [_jsx("div", { className: `max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${mine
                                    ? "bg-[var(--z-accent)] text-[var(--z-on-accent,white)]"
                                    : "bg-[var(--z-surface-hover)] text-[var(--z-fg)]"}`, children: msg.body }), _jsxs("span", { className: "text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: [(_a = msg.authorName) !== null && _a !== void 0 ? _a : (mine ? "You" : "Them"), " \u00B7", " ", formatTimestamp(msg.createdAt)] })] }, msg.id));
                }) }))] }));
}
