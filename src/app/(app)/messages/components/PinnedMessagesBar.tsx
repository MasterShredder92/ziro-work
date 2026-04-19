"use client";

import type { Message } from "@/lib/messaging/types";

type PinnedMessagesBarProps = {
  pinnedIds: string[];
  messages: Message[];
  senderLabelFor: (message: Message) => string;
  onSelectMessage: (messageId: string) => void;
  onUnpinMessage: (messageId: string) => void;
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function previewText(message: Message): string {
  const text = message.body.trim().replace(/\s+/g, " ");
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

export function PinnedMessagesBar({
  pinnedIds,
  messages,
  senderLabelFor,
  onSelectMessage,
  onUnpinMessage,
}: PinnedMessagesBarProps) {
  const byId = new Map(messages.map((message) => [message.id, message]));
  const pinnedMessages = pinnedIds
    .map((id) => byId.get(id))
    .filter((message): message is Message => Boolean(message));

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="border-b border-[var(--z-border)] px-3 py-2 sm:px-4">
      <div className="hidden gap-2 overflow-x-auto pb-1 sm:flex">
        {pinnedMessages.map((message) => (
          <div
            key={message.id}
            className="min-w-[240px] max-w-[280px] shrink-0 rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-left hover:bg-[var(--z-surface-hover)]"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelectMessage(message.id)}
                className="truncate text-xs font-semibold text-[var(--z-fg)]"
              >
                {senderLabelFor(message)}
              </button>
              <button
                type="button"
                onClick={() => {
                  onUnpinMessage(message.id);
                }}
                className="rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] text-[var(--z-muted)] hover:bg-[var(--z-surface)]"
              >
                Unpin
              </button>
            </div>
            <button
              type="button"
              onClick={() => onSelectMessage(message.id)}
              className="mt-1 w-full text-left"
            >
              <p className="line-clamp-2 text-xs text-[var(--z-muted)]">
                {previewText(message)}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
                {formatTimestamp(message.createdAt)}
              </p>
            </button>
          </div>
        ))}
      </div>
      <details className="sm:hidden">
        <summary className="cursor-pointer text-xs font-medium text-[var(--z-muted)]">
          Pinned messages ({pinnedMessages.length})
        </summary>
        <div className="mt-2 space-y-2">
          {pinnedMessages.map((message) => (
            <div
              key={message.id}
              className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2"
            >
              <button
                type="button"
                onClick={() => onSelectMessage(message.id)}
                className="w-full text-left"
              >
                <p className="truncate text-xs font-semibold text-[var(--z-fg)]">
                  {senderLabelFor(message)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--z-muted)]">
                  {previewText(message)}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
                  {formatTimestamp(message.createdAt)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onUnpinMessage(message.id)}
                className="mt-2 rounded border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] text-[var(--z-muted)]"
              >
                Unpin
              </button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
