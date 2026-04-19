"use client";

import { X } from "lucide-react";
import { useMemo } from "react";
import type { Message } from "@/lib/messaging/types";
import {
  deriveThreadAnalytics,
  type ThreadAnalyticsMilestone,
} from "./deriveThreadAnalytics";

export type ThreadAnalyticsPanelProps = {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  currentProfileId: string;
};

function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 60_000) return "<1m";
  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRate(value: number): string {
  return value.toFixed(value < 10 ? 1 : 0);
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface-2)] p-4">
      <div className="text-sm text-[var(--z-muted)]">{label}</div>
      <div className="text-xl font-semibold text-[var(--z-fg)]">{value}</div>
    </div>
  );
}

function MilestoneRow({ milestone }: { milestone: ThreadAnalyticsMilestone }) {
  return (
    <li className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2">
      <p className="text-sm font-medium text-[var(--z-fg)]">{milestone.label}</p>
      <p className="text-xs text-[var(--z-muted)]">{formatDateTime(milestone.timestamp)}</p>
    </li>
  );
}

export function ThreadAnalyticsPanel({
  open,
  onClose,
  messages,
  currentProfileId,
}: ThreadAnalyticsPanelProps) {
  const analytics = useMemo(
    () => deriveThreadAnalytics(messages, currentProfileId),
    [messages, currentProfileId],
  );

  return (
    <aside
      className={`pointer-events-none absolute inset-y-0 right-0 z-30 w-full sm:w-80 ${
        open ? "" : "translate-x-full"
      } transform transition-transform duration-200 ease-out`}
      aria-hidden={!open}
    >
      <div className="pointer-events-auto flex h-full flex-col border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-[-10px_0_30px_rgba(0,0,0,0.18)]">
        <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">Thread Analytics</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
          >
            <span className="sr-only">Close analytics panel</span>
            <X className="size-4" aria-hidden />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Overview
            </h3>
            <div className="space-y-2">
              <MetricCard label="Total messages" value={analytics.counts.totalMessages} />
              <MetricCard
                label="Messages with attachments"
                value={analytics.counts.messagesWithAttachments}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Message Mix
            </h3>
            <div className="space-y-2">
              <MetricCard label="Outbound" value={analytics.counts.outboundMessages} />
              <MetricCard label="Inbound" value={analytics.counts.inboundMessages} />
              <MetricCard label="System" value={analytics.counts.systemMessages} />
              <MetricCard label="Template" value={analytics.counts.templateMessages} />
              <MetricCard label="Test" value={analytics.counts.testMessages} />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Timing
            </h3>
            <div className="space-y-2">
              <MetricCard label="Thread age" value={formatDuration(analytics.timing.threadAgeMs)} />
              <MetricCard
                label="Avg inbound → outbound"
                value={formatDuration(analytics.timing.avgInboundToOutboundMs)}
              />
              <MetricCard
                label="Avg outbound → inbound"
                value={formatDuration(analytics.timing.avgOutboundToInboundMs)}
              />
              <MetricCard label="Longest gap" value={formatDuration(analytics.timing.longestGapMs)} />
              <MetricCard
                label="First response time"
                value={formatDuration(analytics.timing.firstResponseMs)}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Engagement
            </h3>
            <div className="space-y-2">
              <MetricCard label="Days active" value={analytics.engagement.daysActive} />
              <MetricCard
                label="Messages per day"
                value={formatRate(analytics.engagement.messagesPerDay)}
              />
              <MetricCard
                label="Attachments per day"
                value={formatRate(analytics.engagement.attachmentsPerDay)}
              />
              <MetricCard
                label="Templates per day"
                value={formatRate(analytics.engagement.templatesPerDay)}
              />
              <MetricCard
                label="Test sends per day"
                value={formatRate(analytics.engagement.testSendsPerDay)}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Channel Mix
            </h3>
            <div className="space-y-2">
              <MetricCard label="Email" value={analytics.channels.email} />
              <MetricCard label="SMS" value={analytics.channels.sms} />
              <MetricCard label="Internal/system" value={analytics.channels.internalSystem} />
              {Object.entries(analytics.channels.other).map(([channel, count]) => (
                <MetricCard
                  key={channel}
                  label={`Other · ${channel}`}
                  value={count}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--z-muted)]">
              Milestones
            </h3>
            {analytics.milestones.length === 0 ? (
              <p className="text-sm text-[var(--z-muted)]">No milestones yet.</p>
            ) : (
              <ol className="space-y-2">
                {analytics.milestones.map((milestone) => (
                  <MilestoneRow key={milestone.key} milestone={milestone} />
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </aside>
  );
}
