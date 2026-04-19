"use client";

import { useMemo } from "react";
import type { Message } from "@/lib/messaging/types";
import { deriveThreadAnalytics } from "./deriveThreadAnalytics";

export type ThreadAnalyticsSummaryProps = {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  currentProfileId: string;
};

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-[var(--z-muted)]">{label}</div>
      <div className="mt-0.5 text-lg font-semibold text-[var(--z-fg)]">{value}</div>
    </li>
  );
}

export function ThreadAnalyticsSummary({
  open,
  onClose,
  messages,
  currentProfileId,
}: ThreadAnalyticsSummaryProps) {
  const analytics = useMemo(
    () => deriveThreadAnalytics(messages, currentProfileId),
    [messages, currentProfileId],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex" role="presentation">
      <button
        type="button"
        aria-label="Close analytics summary"
        className="flex-1 bg-black/45"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
                Thread analytics
              </div>
              <div className="text-sm font-semibold text-[var(--z-fg)]">Summary</div>
            </div>
            <button
              type="button"
              className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              <Metric label="Total messages" value={analytics.counts.totalMessages} />
              <Metric label="Total edits" value={analytics.counts.editsTotal} />
              <Metric label="Total deletes" value={analytics.counts.deletesTotal} />
              <Metric label="Total reactions" value={analytics.counts.reactionsTotal} />
              <Metric label="Total pins" value={analytics.counts.pinsTotal} />
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
