"use client";

import { useCallback, useMemo, useState } from "react";

export const ALLOWED_REACTIONS = ["👍", "❤️", "✔️", "❗"] as const;
export type AllowedReaction = (typeof ALLOWED_REACTIONS)[number];

export type MessageReactionsState = {
  [messageId: string]: {
    [reaction: string]: number;
  };
};

type UserReactionState = {
  [messageId: string]: {
    [reaction: string]: true;
  };
};

function clampReaction(reaction: string): AllowedReaction | null {
  return ALLOWED_REACTIONS.includes(reaction as AllowedReaction)
    ? (reaction as AllowedReaction)
    : null;
}

export function useMessageReactions() {
  const [countsByMessage, setCountsByMessage] = useState<MessageReactionsState>({});
  const [mineByMessage, setMineByMessage] = useState<UserReactionState>({});

  const addReaction = useCallback((messageId: string, reaction: string) => {
    const safe = clampReaction(reaction);
    if (!safe || !messageId) return false;

    let added = false;
    setMineByMessage((prev) => {
      const mineForMessage = prev[messageId] ?? {};
      if (mineForMessage[safe]) return prev;
      added = true;
      return {
        ...prev,
        [messageId]: { ...mineForMessage, [safe]: true },
      };
    });
    if (!added) return false;

    setCountsByMessage((prev) => {
      const counts = prev[messageId] ?? {};
      return {
        ...prev,
        [messageId]: {
          ...counts,
          [safe]: (counts[safe] ?? 0) + 1,
        },
      };
    });
    return true;
  }, []);

  const removeReaction = useCallback((messageId: string, reaction: string) => {
    const safe = clampReaction(reaction);
    if (!safe || !messageId) return false;

    let removed = false;
    setMineByMessage((prev) => {
      const mineForMessage = prev[messageId] ?? {};
      if (!mineForMessage[safe]) return prev;
      removed = true;
      const nextForMessage = { ...mineForMessage };
      delete nextForMessage[safe];
      if (Object.keys(nextForMessage).length === 0) {
        const next = { ...prev };
        delete next[messageId];
        return next;
      }
      return { ...prev, [messageId]: nextForMessage };
    });
    if (!removed) return false;

    setCountsByMessage((prev) => {
      const counts = prev[messageId] ?? {};
      const current = counts[safe] ?? 0;
      const nextForMessage = { ...counts };
      if (current <= 1) delete nextForMessage[safe];
      else nextForMessage[safe] = current - 1;

      if (Object.keys(nextForMessage).length === 0) {
        const next = { ...prev };
        delete next[messageId];
        return next;
      }
      return { ...prev, [messageId]: nextForMessage };
    });
    return true;
  }, []);

  const toggleReaction = useCallback(
    (messageId: string, reaction: string) => {
      const safe = clampReaction(reaction);
      if (!safe || !messageId) return { added: false, removed: false };
      const mine = Boolean(mineByMessage[messageId]?.[safe]);
      if (mine) return { added: false, removed: removeReaction(messageId, safe) };
      return { added: addReaction(messageId, safe), removed: false };
    },
    [addReaction, mineByMessage, removeReaction],
  );

  const getReactions = useCallback(
    (messageId: string) => countsByMessage[messageId] ?? {},
    [countsByMessage],
  );

  const hasReacted = useCallback(
    (messageId: string, reaction: string) =>
      Boolean(clampReaction(reaction) && mineByMessage[messageId]?.[reaction]),
    [mineByMessage],
  );

  const snapshot = useMemo(
    () => ({
      countsByMessage,
      mineByMessage,
    }),
    [countsByMessage, mineByMessage],
  );

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
