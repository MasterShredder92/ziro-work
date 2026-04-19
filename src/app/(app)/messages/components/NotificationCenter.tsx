import Link from "next/link";
import type {
  MessageThread,
  NotificationBadge,
  UnreadSummary,
} from "@/lib/messaging/types";

interface NotificationCenterProps {
  badge: NotificationBadge;
  unread: UnreadSummary;
  threads: MessageThread[];
}

export function NotificationCenter({
  badge,
  unread,
  threads,
}: NotificationCenterProps) {
  const unreadThreads = threads
    .filter((t) => t.unreadCount > 0)
    .slice(0, 8);

  const byChannel: Record<string, number> = {};
  for (const t of unread.threads) {
    byChannel[t.channelType] =
      (byChannel[t.channelType] ?? 0) + t.unreadCount;
  }

  return (
    <aside className="flex flex-col gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">
          Notifications
        </h2>
        <span className="text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
          {badge.totalUnread} total
        </span>
      </header>

      <dl className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2">
          <dt className="text-[10px] uppercase text-[var(--z-muted)]">
            Unread
          </dt>
          <dd className="text-sm font-semibold text-[var(--z-fg)]">
            {badge.totalUnread}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2">
          <dt className="text-[10px] uppercase text-[var(--z-muted)]">
            Mentions
          </dt>
          <dd className="text-sm font-semibold text-[var(--z-fg)]">
            {badge.mentions}
          </dd>
        </div>
        <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] p-2">
          <dt className="text-[10px] uppercase text-[var(--z-muted)]">
            Alerts
          </dt>
          <dd className="text-sm font-semibold text-[var(--z-fg)]">
            {badge.alerts}
          </dd>
        </div>
      </dl>

      {unreadThreads.length === 0 ? (
        <p className="text-xs text-[var(--z-muted)]">
          You are all caught up.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--z-border)]">
          {unreadThreads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/messages/threads/${t.id}`}
                className="flex items-center justify-between gap-2 py-2 text-xs hover:bg-[var(--z-surface-hover)]"
              >
                <span className="truncate text-[var(--z-fg)]">
                  {t.subject ?? "Conversation"}
                </span>
                <span className="shrink-0 rounded-full bg-[var(--z-accent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--z-on-accent,white)]">
                  {t.unreadCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {Object.keys(byChannel).length > 0 ? (
        <footer className="text-[10px] text-[var(--z-muted)]">
          By channel:{" "}
          {Object.entries(byChannel)
            .map(([ch, n]) => `${ch}: ${n}`)
            .join(" · ")}
        </footer>
      ) : null}
    </aside>
  );
}
