"use client";
import { useCallback, useMemo, useState } from "react";
export const ALLOWED_REACTIONS = ["👍", "❤️", "✔️", "❗"];
function clampReaction(reaction) {
    return ALLOWED_REACTIONS.includes(reaction)
        ? reaction
        : null;
}
export function useMessageReactions() {
    const [countsByMessage, setCountsByMessage] = useState({});
    const [mineByMessage, setMineByMessage] = useState({});
    const addReaction = useCallback((messageId, reaction) => {
        const safe = clampReaction(reaction);
        if (!safe || !messageId)
            return false;
        let added = false;
        setMineByMessage((prev) => {
            var _a;
            const mineForMessage = (_a = prev[messageId]) !== null && _a !== void 0 ? _a : {};
            if (mineForMessage[safe])
                return prev;
            added = true;
            return Object.assign(Object.assign({}, prev), { [messageId]: Object.assign(Object.assign({}, mineForMessage), { [safe]: true }) });
        });
        if (!added)
            return false;
        setCountsByMessage((prev) => {
            var _a, _b;
            const counts = (_a = prev[messageId]) !== null && _a !== void 0 ? _a : {};
            return Object.assign(Object.assign({}, prev), { [messageId]: Object.assign(Object.assign({}, counts), { [safe]: ((_b = counts[safe]) !== null && _b !== void 0 ? _b : 0) + 1 }) });
        });
        return true;
    }, []);
    const removeReaction = useCallback((messageId, reaction) => {
        const safe = clampReaction(reaction);
        if (!safe || !messageId)
            return false;
        let removed = false;
        setMineByMessage((prev) => {
            var _a;
            const mineForMessage = (_a = prev[messageId]) !== null && _a !== void 0 ? _a : {};
            if (!mineForMessage[safe])
                return prev;
            removed = true;
            const nextForMessage = Object.assign({}, mineForMessage);
            delete nextForMessage[safe];
            if (Object.keys(nextForMessage).length === 0) {
                const next = Object.assign({}, prev);
                delete next[messageId];
                return next;
            }
            return Object.assign(Object.assign({}, prev), { [messageId]: nextForMessage });
        });
        if (!removed)
            return false;
        setCountsByMessage((prev) => {
            var _a, _b;
            const counts = (_a = prev[messageId]) !== null && _a !== void 0 ? _a : {};
            const current = (_b = counts[safe]) !== null && _b !== void 0 ? _b : 0;
            const nextForMessage = Object.assign({}, counts);
            if (current <= 1)
                delete nextForMessage[safe];
            else
                nextForMessage[safe] = current - 1;
            if (Object.keys(nextForMessage).length === 0) {
                const next = Object.assign({}, prev);
                delete next[messageId];
                return next;
            }
            return Object.assign(Object.assign({}, prev), { [messageId]: nextForMessage });
        });
        return true;
    }, []);
    const toggleReaction = useCallback((messageId, reaction) => {
        var _a;
        const safe = clampReaction(reaction);
        if (!safe || !messageId)
            return { added: false, removed: false };
        const mine = Boolean((_a = mineByMessage[messageId]) === null || _a === void 0 ? void 0 : _a[safe]);
        if (mine)
            return { added: false, removed: removeReaction(messageId, safe) };
        return { added: addReaction(messageId, safe), removed: false };
    }, [addReaction, mineByMessage, removeReaction]);
    const getReactions = useCallback((messageId) => { var _a; return (_a = countsByMessage[messageId]) !== null && _a !== void 0 ? _a : {}; }, [countsByMessage]);
    const hasReacted = useCallback((messageId, reaction) => { var _a; return Boolean(clampReaction(reaction) && ((_a = mineByMessage[messageId]) === null || _a === void 0 ? void 0 : _a[reaction])); }, [mineByMessage]);
    const snapshot = useMemo(() => ({
        countsByMessage,
        mineByMessage,
    }), [countsByMessage, mineByMessage]);
    return {
        allowedReactions: ALLOWED_REACTIONS,
        addReaction,
        removeReaction,
        toggleReaction,
        getReactions,
        hasReacted,
        snapshot,
    };
}
