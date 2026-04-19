"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Message } from "@/lib/messaging/types";
import { updateMessageAction } from "../actions/updateMessageAction";
import { collectSearchMatches } from "./searchThreadMessages";
import {
  deriveThreadTimeline,
  isMessageTestMessage,
  type ThreadTimelinePulseEvent,
} from "./deriveThreadTimeline";
import { PinnedMessagesBar } from "./PinnedMessagesBar";
import { ThreadMessage } from "./ThreadMessage";
import { ThreadSearchBar } from "./ThreadSearchBar";
import { ThreadTimeline } from "./ThreadTimeline";
import { showMessagingToast } from "./messagingToast";
import { useMessageReactions } from "./useMessageReactions";
import { useInlineMessageEdit } from "./useInlineMessageEdit";
import { usePinnedMessages } from "./usePinnedMessages";
import type { DayBucket } from "./threadConversationUtils";
import {
  formatMessageTime,
  groupMessagesByDay,
  isLikelySystemMessage,
  splitIntoSenderRuns,
} from "./threadConversationUtils";

export type ThreadMessageListProps = {
  messages: Message[];
  currentProfileId: string;
  senderNameLookup: Record<string, string>;
};

export function ThreadMessageList({
  messages,
  currentProfileId,
  senderNameLookup,
}: ThreadMessageListProps) {
  type DeletedOverride = {
    deletedAt: string;
    originalBody: string;
    originalBodyHtml: string | null;
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const msgRefMap = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const dayHeaderRefMap = useRef<Map<string, HTMLDivElement | null>>(
    new Map(),
  );

  const setMsgRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) msgRefMap.current.set(id, el);
    else msgRefMap.current.delete(id);
  }, []);

  const setDayHeaderRef = useCallback(
    (dayKey: string, el: HTMLDivElement | null) => {
      if (el) dayHeaderRefMap.current.set(dayKey, el);
      else dayHeaderRefMap.current.delete(dayKey);
    },
    [],
  );

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(-1);
  const prevDebouncedQuery = useRef(debouncedQuery);

  const [stickToBottom, setStickToBottom] = useState(true);
  const prevLastId = useRef<string | null>(null);
  const [pulseEvents, setPulseEvents] = useState<ThreadTimelinePulseEvent[]>([]);
  const [messagePulseTokens, setMessagePulseTokens] = useState<
    Record<string, number>
  >({});
  const [editUndo, setEditUndo] = useState<
    Record<string, { originalBody: string; expiresAt: number }>
  >({});
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);
  const [bodyOverrides, setBodyOverrides] = useState<Record<string, string>>({});
  const [deletedOverrides, setDeletedOverrides] = useState<
    Record<string, DeletedOverride>
  >({});
  const pulseMessage = useCallback((messageId: string) => {
    setMessagePulseTokens((prev) => ({
      ...prev,
      [messageId]: (prev[messageId] ?? 0) + 1,
    }));
  }, []);
  const editUndoTimersRef = useRef<Map<string, number>>(new Map());
  const editOriginalRef = useRef<Record<string, string>>({});
  const reactions = useMessageReactions();
  const pinned = usePinnedMessages();
  const messagesForRender = useMemo(
    () =>
      messages.map((message) => {
        const deleted = deletedOverrides[message.id];
        if (deleted || message.deletedAt) {
          return {
            ...message,
            body: "",
            bodyHtml: null,
            deletedAt: deleted?.deletedAt ?? message.deletedAt ?? null,
          };
        }
        const overriddenBody = bodyOverrides[message.id];
        if (overriddenBody === undefined) return message;
        return {
          ...message,
          body: overriddenBody,
          bodyHtml: null,
        };
      }),
    [bodyOverrides, deletedOverrides, messages],
  );
  const lastId = messagesForRender.at(-1)?.id ?? "";

  const days: DayBucket[] = useMemo(
    () => groupMessagesByDay(messagesForRender),
    [messagesForRender],
  );
  const searchableDays: DayBucket[] = useMemo(
    () => groupMessagesByDay(messagesForRender.filter((message) => !message.deletedAt)),
    [messagesForRender],
  );

  const { orderedMessageIds, messageById, milestoneByMessageId } = useMemo(
    () =>
      deriveThreadTimeline(messagesForRender, currentProfileId, days, pulseEvents),
    [messagesForRender, currentProfileId, days, pulseEvents],
  );

  const dayKeysInOrder = useMemo(() => days.map((d) => d.dayKey), [days]);

  const getMessageRowEl = useCallback(
    (id: string) => msgRefMap.current.get(id) ?? null,
    [],
  );

  const getDayHeaderEl = useCallback(
    (dayKey: string) => dayHeaderRefMap.current.get(dayKey) ?? null,
    [],
  );

  const senderLabelFor = useCallback(
    (m: Message) =>
      m.senderId === currentProfileId
        ? "You"
        : senderNameLookup[m.senderId] ??
          m.senderName ??
          m.senderId.slice(0, 8),
    [currentProfileId, senderNameLookup],
  );

  const matches = useMemo(
    () => collectSearchMatches(searchableDays, senderLabelFor, debouncedQuery),
    [searchableDays, senderLabelFor, debouncedQuery],
  );

  const messageActionById = useMemo(() => {
    const map = new Map<
      string,
      {
        canEdit: boolean;
        canDelete: boolean;
        canPin: boolean;
        isDeleted: boolean;
        message: Message;
      }
    >();
    for (const msg of messagesForRender) {
      const isSys = isLikelySystemMessage(msg);
      const isDeleted = Boolean(msg.deletedAt);
      map.set(msg.id, {
        canEdit:
          msg.senderId === currentProfileId &&
          !isSys &&
          !msg.templateId &&
          !isMessageTestMessage(msg) &&
          msg.attachments.length === 0 &&
          !isDeleted,
        canDelete:
          msg.senderId === currentProfileId &&
          !isSys &&
          !msg.templateId &&
          !isMessageTestMessage(msg) &&
          msg.attachments.length === 0 &&
          !isDeleted,
        canPin: !isDeleted,
        isDeleted,
        message: msg,
      });
    }
    return map;
  }, [messagesForRender, currentProfileId]);

  useEffect(() => {
    return () => {
      for (const timer of editUndoTimersRef.current.values()) {
        window.clearTimeout(timer);
      }
      editUndoTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const qChanged = prevDebouncedQuery.current !== debouncedQuery;
    prevDebouncedQuery.current = debouncedQuery;
    const t = window.setTimeout(() => {
      if (matches.length === 0) {
        setActiveIdx(-1);
        return;
      }
      if (qChanged) {
        setActiveIdx(0);
        return;
      }
      setActiveIdx((i) => {
        if (i < 0) return 0;
        if (i >= matches.length) return matches.length - 1;
        return i;
      });
    }, 0);
    return () => window.clearTimeout(t);
  }, [debouncedQuery, matches]);

  const activeMatchId =
    activeIdx >= 0 && matches[activeIdx] ? matches[activeIdx]!.messageId : null;

  useEffect(() => {
    if (!activeMatchId) return;
    const el = msgRefMap.current.get(activeMatchId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchId, activeIdx]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distance < 72);
    if (distance < 72) {
      setShowNewMessagesPill(false);
    }
  }, []);

  useEffect(() => {
    if (!lastId) {
      prevLastId.current = null;
      return;
    }
    const prev = prevLastId.current;
    prevLastId.current = lastId;
    if (prev === null) {
      queueMicrotask(() =>
        endRef.current?.scrollIntoView({ behavior: "auto", block: "end" }),
      );
      return;
    }
    if (prev === lastId) return;
    const lastMessage = messagesForRender.at(-1) ?? null;
    const inbound = Boolean(
      lastMessage &&
        lastMessage.senderId !== currentProfileId &&
        !lastMessage.deletedAt,
    );
    if (debouncedQuery.trim()) {
      if (!stickToBottom && inbound) {
        setShowNewMessagesPill(true);
      }
      return;
    }
    if (!stickToBottom) {
      if (inbound) setShowNewMessagesPill(true);
      return;
    }
    queueMicrotask(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    );
    if (inbound && lastMessage) {
      pulseMessage(lastMessage.id);
    }
  }, [lastId, stickToBottom, debouncedQuery, messagesForRender, currentProfileId, pulseMessage]);


  const onDebouncedQueryChange = useCallback((q: string) => {
    setDebouncedQuery(q);
  }, []);

  const onPrev = useCallback(() => {
    setActiveIdx((i) => {
      if (matches.length === 0) return -1;
      if (i <= 0) return matches.length - 1;
      return i - 1;
    });
  }, [matches.length]);

  const onNext = useCallback(() => {
    setActiveIdx((i) => {
      if (matches.length === 0) return -1;
      if (i < 0) return 0;
      return (i + 1) % matches.length;
    });
  }, [matches.length]);

  const onJumpFirst = useCallback(() => {
    if (matches.length === 0) return;
    setActiveIdx(0);
  }, [matches.length]);

  const searchActive = debouncedQuery.trim().length > 0;

  const searchLayoutKey = `${debouncedQuery}:${activeIdx}:${activeMatchId ?? ""}`;
  const pinnedIds = useMemo(
    () =>
      messagesForRender
        .map((message) => message.id)
        .filter((id) => {
          const message = messagesForRender.find((m) => m.id === id);
          return Boolean(message && !message.deletedAt && pinned.isPinned(id));
        }),
    [messagesForRender, pinned],
  );

  const scheduleEditUndo = useCallback((messageId: string, originalBody: string) => {
    const existing = editUndoTimersRef.current.get(messageId);
    if (existing) window.clearTimeout(existing);
    const expiresAt = Date.now() + 5000;
    setEditUndo((prev) => ({ ...prev, [messageId]: { originalBody, expiresAt } }));
    const timer = window.setTimeout(() => {
      setEditUndo((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      editUndoTimersRef.current.delete(messageId);
    }, 5000);
    editUndoTimersRef.current.set(messageId, timer);
  }, []);

  const handleUndoEdit = useCallback(
    (messageId: string) => {
      const undo = editUndo[messageId];
      if (!undo) return;
      const existing = editUndoTimersRef.current.get(messageId);
      if (existing) {
        window.clearTimeout(existing);
        editUndoTimersRef.current.delete(messageId);
      }
      setBodyOverrides((prev) => ({ ...prev, [messageId]: undo.originalBody }));
      setEditUndo((prev) => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      setPulseEvents((prev) => [
        ...prev,
        {
          type: "edit-undo",
          messageId,
          timestamp: new Date().toISOString(),
        },
      ]);
      pulseMessage(messageId);
    },
    [editUndo, pulseMessage],
  );

  const inlineEdit = useInlineMessageEdit({
    onOptimisticUpdate: (messageId, nextBody) => {
      setBodyOverrides((prev) => ({ ...prev, [messageId]: nextBody }));
    },
    onRevert: (messageId, originalBody) => {
      setBodyOverrides((prev) => ({ ...prev, [messageId]: originalBody }));
    },
    onSaved: (message) => {
      const originalBody = editOriginalRef.current[message.id] ?? message.body;
      delete editOriginalRef.current[message.id];
      setBodyOverrides((prev) => ({ ...prev, [message.id]: message.body }));
      setPulseEvents((prev) => [
        ...prev,
        {
          type: "edit",
          messageId: message.id,
          timestamp: new Date().toISOString(),
        },
      ]);
      pulseMessage(message.id);
      if (originalBody !== message.body) {
        scheduleEditUndo(message.id, originalBody);
      }
    },
  });

  const handleDeleteMessage = useCallback(
    async (message: Message) => {
      const isSystem = isLikelySystemMessage(message);
      const canDelete =
        message.senderId === currentProfileId &&
        !isSystem &&
        !message.templateId &&
        !isMessageTestMessage(message) &&
        message.attachments.length === 0 &&
        !message.deletedAt;
      if (!canDelete) return;

      const deletedAt = new Date();
      setDeletedOverrides((prev) => ({
        ...prev,
        [message.id]: {
          deletedAt: deletedAt.toISOString(),
          originalBody: message.body,
          originalBodyHtml: message.bodyHtml,
        },
      }));
      setBodyOverrides((prev) => {
        const next = { ...prev };
        delete next[message.id];
        return next;
      });
      pinned.unpinMessage(message.id);
      try {
        await updateMessageAction(message.id, { deletedAt });
        setPulseEvents((prev) => [
          ...prev,
          {
            type: "delete",
            messageId: message.id,
            timestamp: deletedAt.toISOString(),
          },
        ]);
        pulseMessage(message.id);
      } catch (error) {
        setDeletedOverrides((prev) => {
          const next = { ...prev };
          delete next[message.id];
          return next;
        });
        showMessagingToast(
          error instanceof Error ? error.message : "Failed to delete message.",
          "error",
        );
      }
    },
    [currentProfileId, pinned, pulseMessage],
  );

  const handleUndoDelete = useCallback((messageId: string) => {
    setDeletedOverrides((prev) => {
      const deleted = prev[messageId];
      if (!deleted) return prev;
      setBodyOverrides((bodyPrev) => ({ ...bodyPrev, [messageId]: deleted.originalBody }));
      const next = { ...prev };
      delete next[messageId];
      return next;
    });
  }, []);

  const emitPinPulse = useCallback((messageId: string) => {
    setPulseEvents((prev) => [
      ...prev,
      {
        type: "pin",
        messageId,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!focusedMessageId) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const action = messageActionById.get(focusedMessageId);
      if (!action || action.isDeleted) return;
      const key = event.key.toLowerCase();
      if (key === "e" && action.canEdit) {
        event.preventDefault();
        editOriginalRef.current[action.message.id] = action.message.body;
        inlineEdit.startEditing(action.message.id, action.message.body);
        return;
      }
      if (key === "d" && action.canDelete) {
        event.preventDefault();
        void handleDeleteMessage(action.message);
        return;
      }
      if (key === "p" && action.canPin) {
        event.preventDefault();
        const result = pinned.togglePin(action.message.id);
        if (result.pinned) {
          emitPinPulse(action.message.id);
          pulseMessage(action.message.id);
        }
        return;
      }
      if (key === "r") {
        event.preventDefault();
        const result = reactions.toggleReaction(action.message.id, "👍");
        if (result.added) {
          setPulseEvents((prev) => [
            ...prev,
            {
              type: "reaction",
              messageId: action.message.id,
              reaction: "👍",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    emitPinPulse,
    focusedMessageId,
    handleDeleteMessage,
    inlineEdit,
    messageActionById,
    pinned,
    pulseMessage,
    reactions,
  ]);

  const handlePinnedSelect = useCallback(
    (messageId: string) => {
      const el = msgRefMap.current.get(messageId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      pulseMessage(messageId);
    },
    [pulseMessage],
  );

  if (messagesForRender.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div className="sticky top-0 z-10 shrink-0 bg-[var(--z-surface)] px-3 pt-2 sm:px-4">
          <ThreadSearchBar
            onDebouncedQueryChange={onDebouncedQueryChange}
            matchTotal={0}
            activeIndex={-1}
            onPrev={onPrev}
            onNext={onNext}
            onJumpFirst={onJumpFirst}
          />
        </div>
        <div className="flex min-h-[200px] flex-1 items-center justify-center p-8 text-center text-sm text-[var(--z-muted)]">
          No messages yet. Send the first one below.
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <PinnedMessagesBar
        pinnedIds={pinnedIds}
        messages={messagesForRender}
        senderLabelFor={senderLabelFor}
        onSelectMessage={handlePinnedSelect}
        onUnpinMessage={(messageId) => {
          pinned.unpinMessage(messageId);
        }}
      />
      <div className="sticky top-0 z-10 shrink-0 bg-[var(--z-surface)] px-3 pt-2 sm:px-4">
        <ThreadSearchBar
          onDebouncedQueryChange={onDebouncedQueryChange}
          matchTotal={matches.length}
          activeIndex={matches.length ? Math.max(0, activeIdx) : 0}
          onPrev={onPrev}
          onNext={onNext}
          onJumpFirst={onJumpFirst}
        />
      </div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2 sm:px-4"
      >
        <div ref={contentRef} className="relative min-h-full pl-8">
          <ThreadTimeline
            scrollRootRef={scrollRef}
            contentRootRef={contentRef}
            orderedMessageIds={orderedMessageIds}
            dayKeysInOrder={dayKeysInOrder}
            getMessageRowEl={getMessageRowEl}
            getDayHeaderEl={getDayHeaderEl}
            messageById={messageById}
            milestoneByMessageId={milestoneByMessageId}
            dayBuckets={days}
            currentProfileId={currentProfileId}
            searchLayoutKey={searchLayoutKey}
            pulseEvents={pulseEvents}
          />
          {days.map((day) => (
            <section key={day.dayKey} className="flex flex-col">
              <div
                ref={(el) => setDayHeaderRef(day.dayKey, el)}
                className="my-4 text-center text-xs text-zinc-500"
              >
                {day.label}
              </div>
              {(() => {
                const runs = splitIntoSenderRuns(day.messages);
                return runs.map((run, runIdx) => {
                  const prevRun = runIdx > 0 ? runs[runIdx - 1] : null;
                  const prevTail = prevRun?.[prevRun.length - 1] ?? null;
                  const nextHead = run[0] ?? null;
                  const showGapTimestamp =
                    prevTail && nextHead
                      ? new Date(nextHead.createdAt).getTime() -
                          new Date(prevTail.createdAt).getTime() >
                        10 * 60_000
                      : false;
                  return (
                <div
                  key={`${day.dayKey}-${run[0]!.id}-${runIdx}`}
                  className={runIdx > 0 ? "mt-2" : ""}
                >
                  {showGapTimestamp && nextHead ? (
                    <div className="my-1 text-center text-[10px] text-[var(--z-muted)]">
                      {formatMessageTime(nextHead.createdAt)}
                    </div>
                  ) : null}
                  {run.map((msg, idx) => {
                    const isMine = msg.senderId === currentProfileId;
                    const isSys = isLikelySystemMessage(msg);
                    const isDeleted = Boolean(msg.deletedAt);
                    const senderLabel = senderLabelFor(msg);
                    const isActive =
                      Boolean(activeMatchId) && activeMatchId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        ref={(el) => setMsgRef(msg.id, el)}
                        className="flex w-full flex-col"
                      >
                        <ThreadMessage
                          message={msg}
                          senderLabel={senderLabel}
                          isMine={isMine}
                          isSystem={isSys}
                          compactMeta={idx > 0 && !isSys}
                          groupedWithPrevious={idx > 0}
                          searchQuery={searchActive ? debouncedQuery : ""}
                          isActiveSearchMatch={isActive}
                          reactions={isDeleted ? {} : reactions.getReactions(msg.id)}
                          hasReaction={(reaction) =>
                            isDeleted ? false : reactions.hasReacted(msg.id, reaction)
                          }
                          onToggleReaction={(reaction) =>
                            isDeleted
                              ? { added: false, removed: false }
                              : reactions.toggleReaction(msg.id, reaction)
                          }
                          onReactionAdded={(reaction) =>
                            isDeleted
                              ? undefined
                              : setPulseEvents((prev) => [
                                  ...prev,
                                  {
                                    type: "reaction",
                                    messageId: msg.id,
                                    reaction,
                                    timestamp: new Date().toISOString(),
                                  },
                                ])
                          }
                          isPinned={!isDeleted && pinned.isPinned(msg.id)}
                          onTogglePin={() =>
                            isDeleted
                              ? { pinned: false, unpinned: false }
                              : pinned.togglePin(msg.id)
                          }
                          onPinAdded={() => {
                            emitPinPulse(msg.id);
                            pulseMessage(msg.id);
                          }}
                          pulseToken={messagePulseTokens[msg.id] ?? 0}
                          canEdit={
                            msg.senderId === currentProfileId &&
                            !isSys &&
                            !msg.templateId &&
                            !isMessageTestMessage(msg) &&
                            msg.attachments.length === 0 &&
                            !msg.deletedAt
                          }
                          isEditing={inlineEdit.editingMessageId === msg.id}
                          editIsSaving={
                            inlineEdit.isSaving &&
                            inlineEdit.editingMessageId === msg.id
                          }
                          onStartEdit={() => {
                            editOriginalRef.current[msg.id] = msg.body;
                            inlineEdit.startEditing(msg.id, msg.body);
                          }}
                          editInputProps={inlineEdit.bindInputProps()}
                          canDelete={
                            msg.senderId === currentProfileId &&
                            !isSys &&
                            !msg.templateId &&
                            !isMessageTestMessage(msg) &&
                            msg.attachments.length === 0 &&
                            !msg.deletedAt
                          }
                          isDeleted={isDeleted}
                          onDelete={() => void handleDeleteMessage(msg)}
                          onUndoDelete={() => handleUndoDelete(msg.id)}
                          showUndoEdit={Boolean(editUndo[msg.id] && Date.now() < editUndo[msg.id]!.expiresAt)}
                          onUndoEdit={() => handleUndoEdit(msg.id)}
                          onQuickReact={() => {
                            const result = reactions.toggleReaction(msg.id, "👍");
                            if (result.added) {
                              setPulseEvents((prev) => [
                                ...prev,
                                {
                                  type: "reaction",
                                  messageId: msg.id,
                                  reaction: "👍",
                                  timestamp: new Date().toISOString(),
                                },
                              ]);
                            }
                          }}
                          onFocusMessage={() => setFocusedMessageId(msg.id)}
                        />
                      </div>
                    );
                  })}
                </div>
                  );
                });
              })()}
            </section>
          ))}
          <div ref={endRef} className="h-px w-full shrink-0" aria-hidden />
        </div>
        {showNewMessagesPill ? (
          <div className="pointer-events-none sticky bottom-2 z-10 flex justify-center">
            <button
              type="button"
              className="pointer-events-auto rounded-full border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1 text-xs font-medium text-[var(--z-fg)] shadow hover:bg-[var(--z-surface-hover)]"
              onClick={() => {
                endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                setShowNewMessagesPill(false);
              }}
            >
              New messages
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
