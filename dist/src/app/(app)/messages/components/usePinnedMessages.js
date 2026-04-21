"use client";
import { useCallback, useMemo, useState } from "react";
export function usePinnedMessages() {
    const [state, setState] = useState({ pinned: {} });
    const pinMessage = useCallback((messageId) => {
        if (!messageId)
            return false;
        let changed = false;
        setState((prev) => {
            if (prev.pinned[messageId])
                return prev;
            changed = true;
            return { pinned: Object.assign(Object.assign({}, prev.pinned), { [messageId]: true }) };
        });
        return changed;
    }, []);
    const unpinMessage = useCallback((messageId) => {
        if (!messageId)
            return false;
        let changed = false;
        setState((prev) => {
            if (!prev.pinned[messageId])
                return prev;
            changed = true;
            const next = Object.assign({}, prev.pinned);
            delete next[messageId];
            return { pinned: next };
        });
        return changed;
    }, []);
    const togglePin = useCallback((messageId) => {
        if (!messageId)
            return { pinned: false, unpinned: false };
        if (state.pinned[messageId]) {
            return { pinned: false, unpinned: unpinMessage(messageId) };
        }
        return { pinned: pinMessage(messageId), unpinned: false };
    }, [pinMessage, state.pinned, unpinMessage]);
    const isPinned = useCallback((messageId) => Boolean(state.pinned[messageId]), [state.pinned]);
    const getPinned = useCallback(() => Object.keys(state.pinned), [state.pinned]);
    const snapshot = useMemo(() => state, [state]);
    return {
        pinMessage,
        unpinMessage,
        togglePin,
        isPinned,
        getPinned,
        snapshot,
    };
}
