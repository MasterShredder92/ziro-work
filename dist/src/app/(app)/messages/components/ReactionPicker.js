"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { ALLOWED_REACTIONS, } from "./useMessageReactions";
function useIsMobile() {
    const [mobile, setMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 639px)");
        const sync = () => setMobile(mq.matches);
        sync();
        mq.addEventListener("change", sync);
        return () => mq.removeEventListener("change", sync);
    }, []);
    return mobile;
}
export function ReactionPicker({ open, anchorRef, onClose, onToggleReaction, hasReaction, }) {
    const [desktopStyle, setDesktopStyle] = useState(undefined);
    const panelRef = useRef(null);
    const isMobile = useIsMobile();
    useEffect(() => {
        if (!open)
            return;
        const onKeyDown = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        const onPointerDown = (e) => {
            var _a, _b;
            const target = e.target;
            if (!target)
                return;
            if ((_a = panelRef.current) === null || _a === void 0 ? void 0 : _a.contains(target))
                return;
            if ((_b = anchorRef.current) === null || _b === void 0 ? void 0 : _b.contains(target))
                return;
            onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    }, [anchorRef, onClose, open]);
    useEffect(() => {
        if (!open || isMobile)
            return;
        const anchor = anchorRef.current;
        if (!anchor)
            return;
        const rect = anchor.getBoundingClientRect();
        setDesktopStyle({
            top: rect.bottom + 6,
            left: Math.max(8, rect.left - 96),
        });
    }, [anchorRef, isMobile, open]);
    if (!open || typeof document === "undefined")
        return null;
    if (isMobile) {
        return createPortal(_jsxs("div", { className: "fixed inset-0 z-40 sm:hidden", children: [_jsx("button", { type: "button", "aria-label": "Close reactions", onClick: onClose, className: "absolute inset-0 bg-black/30" }), _jsxs("div", { ref: panelRef, className: "absolute inset-x-0 bottom-0 rounded-t-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4 shadow-2xl", role: "dialog", "aria-modal": "false", "aria-label": "Choose reaction", children: [_jsx("div", { className: "mb-3 text-sm font-medium text-[var(--z-fg)]", children: "React to message" }), _jsx("div", { className: "grid grid-cols-4 gap-2", children: ALLOWED_REACTIONS.map((reaction) => {
                                const active = hasReaction(reaction);
                                return (_jsx("button", { type: "button", onClick: () => {
                                        onToggleReaction(reaction);
                                        onClose();
                                    }, className: `rounded-lg border px-3 py-2 text-lg transition ${active
                                        ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)]"
                                        : "border-[var(--z-border)] bg-[var(--z-surface-2)] hover:bg-[var(--z-surface-hover)]"}`, children: reaction }, reaction));
                            }) })] })] }), document.body);
    }
    return createPortal(_jsx("div", { ref: panelRef, role: "dialog", "aria-modal": "false", "aria-label": "Choose reaction", className: "fixed z-40 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-2 shadow-xl", style: desktopStyle, children: _jsx("div", { className: "flex items-center gap-1", children: ALLOWED_REACTIONS.map((reaction) => {
                const active = hasReaction(reaction);
                return (_jsx("button", { type: "button", onClick: () => {
                        onToggleReaction(reaction);
                        onClose();
                    }, className: `rounded-md border px-2 py-1 text-base transition ${active
                        ? "border-[var(--z-accent)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)]"
                        : "border-[var(--z-border)] bg-[var(--z-surface-2)] hover:bg-[var(--z-surface-hover)]"}`, children: reaction }, reaction));
            }) }) }), document.body);
}
