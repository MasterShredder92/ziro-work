"use client";
import { EmptyState } from "@/components/system/SurfaceStates";

type PortalMessageRow = {
  id: string;
  title: string;
  preview?: string | null;
  subtitle?: string | null;
  updatedAt?: string | null;
};

type PortalMessageListProps = {
  rows: PortalMessageRow[];
  title?: string;
  maxRows?: number;
  emptyLabel?: string;
};

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "--";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "--";
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function PortalMessageList({
  rows,
  title = "Messages",
  maxRows = 10,
  emptyLabel = "No recent messages.",
}: PortalMessageListProps) {
  const data = rows.slice(0, maxRows);
  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h2>
        <span className="text-xs text-[var(--z-muted)]">
          {data.length} {data.length === 1 ? "thread" : "threads"}
        </span>
      </header>
      {data.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyLabel} description="Conversations will appear as soon as they start." />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--z-border)]" role="list">
          {data.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between z-hover-micro-subtle"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--z-fg)]">
                  {row.title}
                </div>
                {row.subtitle ? (
                  <div className="truncate text-xs text-[var(--z-muted)]">
                    {row.subtitle}
                  </div>
                ) : null}
                {row.preview ? (
                  <div className="line-clamp-2 text-xs text-[var(--z-muted)]">
                    {row.preview}
                  </div>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-[var(--z-muted)]">
                {formatRelative(row.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
