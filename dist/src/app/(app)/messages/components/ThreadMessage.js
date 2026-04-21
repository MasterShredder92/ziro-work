"use client";
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, } from "react";
import { Loader2, MoreHorizontal, Pencil, Pin, SmilePlus, Trash2 } from "lucide-react";
import { renderMessageMetadata } from "./messageMetadata";
import { buildPlainSearchText, splitWithHighlights } from "./searchThreadMessages";
import { ReactionPicker } from "./ReactionPicker";
function HighlightedText({ text, query }) {
    const q = query.trim();
    if (!q)
        return _jsx(_Fragment, { children: text });
    return (_jsx(_Fragment, { children: splitWithHighlights(text, q).map((seg, i) => seg.hit ? (_jsx("span", { className: "rounded bg-yellow-500/30 px-0.5", children: seg.text }, i)) : (_jsx("span", { children: seg.text }, i))) }));
}
export function ThreadMessage({ message, senderLabel, isMine, isSystem, compactMeta, groupedWithPrevious, searchQuery = "", isActiveSearchMatch = false, reactions = {}, hasReaction = () => false, onToggleReaction, onReactionAdded, isPinned = false, onTogglePin, onPinAdded, pulseToken = 0, canEdit = false, isEditing = false, editIsSaving = false, onStartEdit, editInputProps, canDelete = false, isDeleted = false, onDelete, onUndoDelete, showUndoEdit = false, onUndoEdit, onQuickReact, onFocusMessage, }) {
    var _a, _b, _c, _d, _e;
    const marginTop = groupedWithPrevious ? "mt-0.5" : "mt-3";
    const q = searchQuery.trim();
    const searchOn = q.length > 0;
    const metadata = renderMessageMetadata(message);
    const activeRing = isActiveSearchMatch && searchOn
        ? "motion-safe:animate-[pulse_1.2s_ease-out] ring-2 ring-[var(--z-accent)]/55"
        : "";
    const [pickerOpen, setPickerOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const addButtonRef = useRef(null);
    const bubbleRef = useRef(null);
    const editRef = useRef(null);
    useEffect(() => {
        if (pulseToken <= 0)
            return;
        if (!bubbleRef.current || typeof bubbleRef.current.animate !== "function")
            return;
        bubbleRef.current.animate([
            { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(250,204,21,0)" },
            { transform: "scale(1.01)", boxShadow: "0 0 0 6px rgba(250,204,21,0.2)" },
            { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(250,204,21,0)" },
        ], { duration: 560, easing: "cubic-bezier(0.22,1,0.36,1)" });
    }, [pulseToken]);
    useEffect(() => {
        if (!isEditing || !editRef.current)
            return;
        const el = editRef.current;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
    }, [isEditing, editInputProps === null || editInputProps === void 0 ? void 0 : editInputProps.value]);
    if (isSystem) {
        return (_jsx("div", { className: `mx-auto max-w-lg px-2 text-center text-xs text-zinc-500 ${marginTop}`, children: searchOn ? _jsx(HighlightedText, { text: message.body, query: q }) : message.body }));
    }
    const timestampEl = metadata.deleted.show ? (_jsx("span", { title: (_a = metadata.deleted.tooltip) !== null && _a !== void 0 ? _a : undefined, className: "text-zinc-400", children: metadata.deleted.label })) : (_jsx("span", { title: metadata.timestampTooltip, className: "text-zinc-400", children: metadata.timestampLabel }));
    const header = compactMeta ? (_jsxs("span", { className: "inline-flex items-center gap-1", children: [timestampEl, metadata.edited.show ? (_jsx("span", { title: (_b = metadata.edited.tooltip) !== null && _b !== void 0 ? _b : undefined, className: "rounded-full border border-[var(--z-border)] px-1 py-0 text-[10px] tracking-normal text-[var(--z-muted)]", children: metadata.edited.label })) : null] })) : (_jsxs("span", { className: "inline-flex items-center gap-1 text-zinc-400", children: [searchOn && !metadata.deleted.show ? (_jsx(HighlightedText, { text: `${senderLabel} ${"\u2022"}`, query: q })) : (_jsxs(_Fragment, { children: [senderLabel, " ", "\u2022"] })), timestampEl, metadata.edited.show ? (_jsx("span", { title: (_c = metadata.edited.tooltip) !== null && _c !== void 0 ? _c : undefined, className: "rounded-full border border-[var(--z-border)] px-1 py-0 text-[10px] tracking-normal text-[var(--z-muted)]", children: metadata.edited.label })) : null] }));
    const hasHtml = Boolean((_d = message.bodyHtml) === null || _d === void 0 ? void 0 : _d.trim());
    const plainForSearch = buildPlainSearchText(message);
    const bodyBlock = searchOn && hasHtml ? (_jsx("div", { className: "whitespace-pre-wrap text-sm leading-relaxed text-[var(--z-fg)]", children: _jsx(HighlightedText, { text: plainForSearch, query: q }) })) : hasHtml ? (_jsx("div", { className: "text-sm leading-relaxed text-[var(--z-fg)] [&_a]:text-[var(--z-accent)] [&_a]:underline", dangerouslySetInnerHTML: { __html: message.bodyHtml } })) : (_jsx("div", { className: "whitespace-pre-wrap text-sm text-[var(--z-fg)]", children: searchOn ? _jsx(HighlightedText, { text: message.body, query: q }) : message.body }));
    const orderedReactions = ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{2714}\u{FE0F}", "\u{2757}"].filter((reaction) => { var _a; return ((_a = reactions[reaction]) !== null && _a !== void 0 ? _a : 0) > 0; });
    const handleToggleReaction = (reaction) => {
        if (!onToggleReaction)
            return;
        const result = onToggleReaction(reaction);
        if (result.added)
            onReactionAdded === null || onReactionAdded === void 0 ? void 0 : onReactionAdded(reaction);
    };
    const handleTogglePin = () => {
        if (!onTogglePin)
            return;
        const result = onTogglePin();
        if (result.pinned)
            onPinAdded === null || onPinAdded === void 0 ? void 0 : onPinAdded();
    };
    return (_jsxs("div", { tabIndex: 0, onFocus: onFocusMessage, className: `group relative flex w-full flex-col ${isMine ? "items-end" : "items-start"} ${marginTop}`, children: [!isDeleted ? (_jsxs("div", { className: `pointer-events-none absolute top-1 z-10 hidden items-center gap-1 rounded-full border border-[var(--z-border)] bg-[var(--z-surface)] px-1.5 py-1 text-[var(--z-muted)] opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 sm:flex ${isMine ? "right-[calc(100%+8px)]" : "right-2"}`, children: [_jsx("button", { type: "button", onClick: onQuickReact, className: "pointer-events-auto rounded p-1 hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]", "aria-label": "React", children: _jsx(SmilePlus, { className: "size-3.5" }) }), _jsx("button", { type: "button", onClick: handleTogglePin, className: "pointer-events-auto rounded p-1 hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]", "aria-label": isPinned ? "Unpin" : "Pin", children: _jsx(Pin, { className: `size-3.5 ${isPinned ? "fill-current text-amber-300" : ""}` }) }), canEdit ? (_jsx("button", { type: "button", onClick: onStartEdit, className: "pointer-events-auto rounded p-1 hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]", "aria-label": "Edit", children: _jsx(Pencil, { className: "size-3.5" }) })) : null, canDelete ? (_jsx("button", { type: "button", onClick: onDelete, className: "pointer-events-auto rounded p-1 text-red-300 hover:bg-red-500/10", "aria-label": "Delete", children: _jsx(Trash2, { className: "size-3.5" }) })) : null] })) : null, _jsxs("div", { ref: bubbleRef, className: `max-w-[min(85%,520px)] rounded-lg border p-3 shadow-sm ${activeRing} ${isMine
                    ? "border-[var(--z-accent)]/40 bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)]"
                    : "border-[var(--z-border)] bg-[var(--z-surface-2)]"} ${isPinned ? "border-l-4 border-l-amber-400" : ""} ${isDeleted
                    ? "border-dashed border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),transparent_22%)]"
                    : ""}`, children: [_jsxs("div", { className: "mb-1 flex items-center justify-between gap-2 text-xs", children: [_jsx("div", { children: header }), isPinned ? (_jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-300", children: [_jsx(Pin, { className: "size-3" }), "Pinned"] })) : null] }), message.subject && !isDeleted ? (_jsx("div", { className: "mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: searchOn ? (_jsx(HighlightedText, { text: (_e = message.subject) !== null && _e !== void 0 ? _e : "", query: q })) : (message.subject) })) : null, isDeleted ? (_jsxs("div", { className: "flex items-center gap-2 text-sm italic text-[var(--z-muted)]", children: [_jsxs("span", { children: ["Message deleted ", "\u2022"] }), _jsx("button", { type: "button", onClick: onUndoDelete, className: "rounded px-1.5 py-0.5 text-xs text-[var(--z-accent)] hover:bg-[var(--z-surface-hover)]", children: "Undo" })] })) : isEditing ? (_jsxs("div", { className: "space-y-1", children: [_jsx("textarea", Object.assign({}, editInputProps, { ref: editRef, rows: 3, className: "w-full resize-none rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]", onInput: (event) => {
                                    const el = event.currentTarget;
                                    el.style.height = "auto";
                                    el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
                                } })), _jsx("div", { className: "flex items-center gap-1 text-[10px] text-[var(--z-muted)]", children: editIsSaving ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "size-3 animate-spin" }), "Saving..."] })) : ("Editing... Enter to save, Shift+Enter for newline, Esc to cancel") })] })) : (bodyBlock), message.attachments.length > 0 ? (_jsx("ul", { className: "mt-2 flex flex-wrap gap-1.5", children: message.attachments.map((a) => (_jsx("li", { children: _jsx("a", { href: a.url, target: "_blank", rel: "noreferrer", className: "inline-flex max-w-[220px] items-center truncate rounded-full border border-[var(--z-border)] bg-[var(--z-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--z-fg)] transition hover:bg-[var(--z-surface-hover)]", children: searchOn ? _jsx(HighlightedText, { text: a.name, query: q }) : a.name }) }, a.id))) })) : null] }), !isDeleted ? (_jsx("button", { type: "button", onClick: handleTogglePin, className: `absolute top-2 rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] p-1 text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] ${isMine ? "right-2" : "left-2"} hidden sm:inline-flex ${isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`, "aria-label": isPinned ? "Unpin message" : "Pin message", children: _jsx(Pin, { className: `size-3 ${isPinned ? "fill-current text-amber-300" : ""}` }) })) : null, _jsxs("div", { className: `absolute top-2 ${isMine ? "right-10" : "left-10"} inline-flex`, children: [_jsx("button", { type: "button", onClick: () => setMenuOpen((v) => !v), className: "inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)] sm:opacity-0 sm:group-hover:opacity-100", "aria-label": "Message options", "aria-expanded": menuOpen, children: _jsx(MoreHorizontal, { className: "size-3.5" }) }), menuOpen ? (_jsxs("div", { className: "absolute top-7 z-20 rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-1 shadow-md", children: [!isDeleted ? (_jsxs("button", { type: "button", onClick: () => {
                                    handleTogglePin();
                                    setMenuOpen(false);
                                }, className: "flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]", children: [_jsx(Pin, { className: "size-3.5" }), isPinned ? "Unpin" : "Pin"] })) : null, canEdit ? (_jsx("button", { type: "button", onClick: () => {
                                    onStartEdit === null || onStartEdit === void 0 ? void 0 : onStartEdit();
                                    setMenuOpen(false);
                                }, className: "flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-[var(--z-surface-hover)]", children: "Edit" })) : null, canDelete ? (_jsxs("button", { type: "button", onClick: () => {
                                    onDelete === null || onDelete === void 0 ? void 0 : onDelete();
                                    setMenuOpen(false);
                                }, className: "flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-red-300 hover:bg-red-500/10", children: [_jsx(Trash2, { className: "size-3.5" }), "Delete"] })) : null] })) : null] }), !isDeleted && showUndoEdit ? (_jsx("div", { className: `mt-1 flex items-center gap-1 text-xs text-[var(--z-muted)] ${isMine ? "justify-end" : "justify-start pl-8"}`, children: _jsx("button", { type: "button", onClick: onUndoEdit, className: "rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-accent)] transition hover:bg-[var(--z-surface-hover)]", children: "Undo edit" }) })) : null, !isDeleted ? (_jsxs("div", { className: `mt-1 flex items-center gap-1 text-xs text-[var(--z-muted)] ${isMine ? "justify-end" : "justify-start pl-8"}`, children: [orderedReactions.map((reaction) => {
                        var _a;
                        const count = (_a = reactions[reaction]) !== null && _a !== void 0 ? _a : 0;
                        const active = hasReaction(reaction);
                        return (_jsxs("button", { type: "button", onClick: () => handleToggleReaction(reaction), className: `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${active
                                ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] text-[var(--z-fg)]"
                                : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"}`, "aria-label": `Toggle reaction ${reaction}`, children: [_jsx("span", { children: reaction }), _jsx("span", { children: count })] }, reaction));
                    }), _jsx("button", { ref: addButtonRef, type: "button", onClick: () => setPickerOpen((v) => !v), className: "inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-xs text-[var(--z-muted)] transition hover:bg-[var(--z-surface-hover)]", "aria-label": "Add reaction", "aria-expanded": pickerOpen, children: "+" }), _jsx(ReactionPicker, { open: pickerOpen, anchorRef: addButtonRef, onClose: () => setPickerOpen(false), onToggleReaction: handleToggleReaction, hasReaction: hasReaction })] })) : null, !compactMeta ? (_jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]", children: [_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-1.5 py-0.5", children: searchOn ? (_jsx(HighlightedText, { text: message.channelType, query: q })) : (message.channelType) }), _jsx("span", { className: `rounded-full px-1.5 py-0.5 ${message.deliveryStatus === "delivered" || message.deliveryStatus === "read"
                            ? "bg-emerald-500/15 text-emerald-200"
                            : message.deliveryStatus === "failed"
                                ? "bg-red-500/15 text-red-200"
                                : "bg-amber-500/15 text-amber-100"}`, children: message.deliveryStatus })] })) : null] }));
}
