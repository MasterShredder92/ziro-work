"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { InboxThread } from "@/lib/messaging/types";

interface InboxListProps {
  threads: InboxThread[];
  totalUnread: number;
}

function formatRelative(ts: string | null | undefined): string {
  if (!ts) return "";
  const then = new Date(ts).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function threadLabel(thread: InboxThread): string {
  if (thread.counterpart?.fullName) return thread.counterpart.fullName;
  if (thread.subject) return thread.subject;
  return "New conversation";
}

export function InboxList({ threads, totalUnread }: InboxListProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const currentThreadId = params.get("thread");

  return (
    <aside className="flex h-full flex-col border-r border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">Inbox</h2>
        <span className="text-xs text-[var(--z-muted)]">
          {threads.length} thread{threads.length === 1 ? "" : "s"}
          {totalUnread > 0 ? ` · ${totalUnread} unread` : ""}
        </span>
      </header>

      {threads.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-sm text-[var(--z-muted)]">
          No conversations yet. Start a new message to get going.
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-[var(--z-border)] overflow-y-auto">
          {threads.map((thread) => {
            const isActive = thread.id === currentThreadId;
            return (
              <li key={thread.id}>
                <Link
                  href={`${pathname}?thread=${thread.id}`}
                  scroll={false}
                  className={`flex flex-col gap-1 px-4 py-3 transition hover:bg-[var(--z-surface-hover)] ${
                    isActive
                      ? "bg-[var(--z-surface-hover)]"
                      : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[var(--z-fg)]">
                      {threadLabel(thread)}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--z-muted)]">
                      {formatRelative(thread.lastMessageAt)}
                    </span>
                  </div>
                  {thread.lastMessagePreview ? (
                    <p className="line-clamp-2 text-xs text-[var(--z-muted)]">
                      {thread.lastMessagePreview}
                    </p>
                  ) : (
                    <p className="text-xs italic text-[var(--z-muted)]">
                      No messages yet
                    </p>
                  )}
                  {thread.unreadCount > 0 ? (
                    <span className="inline-flex w-fit items-center rounded-full bg-[var(--z-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-on-accent,white)]">
                      {thread.unreadCount} new
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
