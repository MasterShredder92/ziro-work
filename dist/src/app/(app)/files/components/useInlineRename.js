"use client";
import { useCallback, useEffect, useRef, useState } from "react";
/** Shared styling for inline rename fields (Files OS). */
export const INLINE_RENAME_INPUT_CLASS = "w-full min-w-0 rounded border border-blue-500 bg-[var(--z-bg)]/80 px-1 py-0.5 text-sm text-[var(--z-fg)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";
/**
 * Draft text + focus/select when entering rename; Escape helper skips blur-save.
 */
export function useInlineRename({ originalName, isEditing, }) {
    const [draft, setDraft] = useState(originalName);
    const skipBlurSaveRef = useRef(false);
    const inputRef = useRef(null);
    useEffect(() => {
        if (!isEditing) {
            queueMicrotask(() => {
                setDraft(originalName);
            });
            return;
        }
        queueMicrotask(() => {
            setDraft(originalName);
            requestAnimationFrame(() => {
                const el = inputRef.current;
                el === null || el === void 0 ? void 0 : el.focus();
                el === null || el === void 0 ? void 0 : el.select();
            });
        });
    }, [isEditing, originalName]);
    const cancelWithoutBlurSave = useCallback((resetTo) => {
        skipBlurSaveRef.current = true;
        queueMicrotask(() => {
            setDraft(resetTo);
            skipBlurSaveRef.current = false;
        });
    }, []);
    return {
        draft,
        setDraft,
        inputRef,
        skipBlurSaveRef,
        cancelWithoutBlurSave,
    };
}
