"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  ChannelType,
  MessageThread,
  NotificationBadge,
  ThreadStatus,
  UnreadSummary,
} from "@/lib/messaging/types";
import { NewMessageModal } from "./NewMessageModal";

type Recipient = { id: string; label: string; role?: string | null };

interface MessagingDashboardProps {
  threads: MessageThread[];
  unread: UnreadSummary;
  badge: NotificationBadge;
  currentProfileId: string;
  recipients: Recipient[];
  canWrite: boolean;
}

const statusOptions: Array<{ id: ThreadStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "archived", label: "Archived" },
  { id: "snoozed", label: "Snoozed" },
];

const channelOptions: Array<{ id: ChannelType | "all"; label: string }> = [
  { id: "all", label: "All channels" },
  { id: "in_app", label: "In-app" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "push", label: "Push" },
];

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

function threadLabel(thread: MessageThread): string {
  if (thread.subject && thread.subject.trim()) return thread.subject;
  return "Conversation";
}

export function MessagingDashboard({
  threads,
  unread,
  badge,
  currentProfileId,
  recipients,
  canWrite,
}: MessagingDashboardProps) {
  const [status, setStatus] = useState<ThreadStatus | "all">("open");
  const [channel, setChannel] = useState<ChannelType | "all">("all");
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (channel !== "all" && t.channelType !== channel) return false;
      if (!q) return true;
      const hay = `${t.subject ?? ""} ${t.lastMessagePreview ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [threads, status, channel, search]);

  void currentProfileId;

  return (
    <section className="flex h-full flex-col gap-4">
      <header className="flex flex-col gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-[var(--z-fg)]">Messaging</h1>
          <p className="text-xs text-[var(--z-muted)]">
            {threads.length} thread{threads.length === 1 ? "" : "s"} ·{" "}
            {unread.totalUnread} unread
            {badge.mentions > 0 ? ` · ${badge.mentions} mentions` : ""}
            {badge.alerts > 0 ? ` · ${badge.alerts} alerts` : ""}
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--z-on-accent,white)] shadow-sm transition hover:brightness-110"
          >
            New message
          </button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
        <input
          type="search"
          placeholder="Search threads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ThreadStatus | "all")}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
        >
          {statusOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as ChannelType | "all")}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
        >
          {channelOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[var(--z-border)] p-10 text-center text-sm text-[var(--z-muted)]">
          No threads match these filters.
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-[var(--z-border)] overflow-y-auto rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
          {filtered.map((thread) => (
            <li key={thread.id}>
              <Link
                href={`/messages/threads/${thread.id}`}
                className="flex flex-col gap-1 px-4 py-3 transition hover:bg-[var(--z-surface-hover)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-[var(--z-fg)]">
                    {threadLabel(thread)}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--z-muted)]">
                    {formatRelative(thread.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--z-muted)]">
                  <span className="inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {thread.channelType}
                  </span>
                  {thread.status !== "open" ? (
                    <span className="inline-flex items-center rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      {thread.status}
                    </span>
                  ) : null}
                  {thread.unreadCount > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-[var(--z-accent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--z-on-accent,white)]">
                      {thread.unreadCount} new
                    </span>
                  ) : null}
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
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showNewModal ? (
        <NewMessageModal
          recipients={recipients}
          onClose={() => setShowNewModal(false)}
        />
      ) : null}
    </section>
  );
}
