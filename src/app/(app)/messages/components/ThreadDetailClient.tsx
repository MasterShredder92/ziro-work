"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Message, MessageParticipant, MessageThread } from "@/lib/messaging/types";
import { ThreadComposer } from "./ThreadComposer";
import { ThreadMessageList } from "./ThreadMessageList";
import { ThreadParticipantsPanel } from "./ThreadParticipantsPanel";
import { deriveThreadAnalytics } from "./deriveThreadAnalytics";
import { ThreadAnalyticsSummary } from "./ThreadAnalyticsSummary";
import type { MessagingTemplateOption } from "./templatePreviewMerge";

type ThreadDetailClientProps = {
  thread: MessageThread;
  participants: MessageParticipant[];
  messages: Message[];
  currentProfileId: string;
  senderNameLookup: Record<string, string>;
  templateOptions: MessagingTemplateOption[];
  canWrite: boolean;
  mergeFields: string[];
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "No activity yet";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "No activity yet";
  const deltaMs = Date.now() - t;
  const absMs = Math.abs(deltaMs);
  const suffix = deltaMs >= 0 ? "ago" : "from now";
  if (absMs < 60_000) return "just now";
  if (absMs < 3_600_000) return `${Math.round(absMs / 60_000)}m ${suffix}`;
  if (absMs < 86_400_000) return `${Math.round(absMs / 3_600_000)}h ${suffix}`;
  return `${Math.round(absMs / 86_400_000)}d ${suffix}`;
}

export function ThreadDetailClient({
  thread,
  participants,
  messages,
  currentProfileId,
  senderNameLookup,
  templateOptions,
  canWrite,
  mergeFields,
}: ThreadDetailClientProps) {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const analytics = useMemo(
    () => deriveThreadAnalytics(messages, currentProfileId),
    [messages, currentProfileId],
  );
  const activityRelative = formatRelativeTime(thread.lastMessageAt);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <header className="flex shrink-0 flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold text-[var(--z-fg)]">
              {thread.subject ?? "Conversation"}
            </h1>
            <p className="text-xs text-[var(--z-muted)]">
              {participants.length} participant
              {participants.length === 1 ? "" : "s"} ·{" "}
              <span className="uppercase tracking-wide">{thread.channelType}</span> ·{" "}
              {thread.status}
            </p>
            <p className="text-[11px] text-[var(--z-muted)]">
              {analytics.counts.totalMessages} messages · {participants.length} participants · Last
              activity {activityRelative}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("thread-participants-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
            >
              Participants
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsOpen((v) => !v)}
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
              aria-expanded={analyticsOpen}
              aria-controls="thread-analytics-panel"
            >
              Analytics
            </button>
            <Link
              href="/messages"
              className="rounded-md border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)]"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <div id="thread-participants-panel">
        <ThreadParticipantsPanel
          participants={participants}
          threadChannelType={thread.channelType}
          contextType={thread.contextType}
          threadSubject={thread.subject}
        />
      </div>

      <ThreadMessageList
        messages={messages}
        currentProfileId={currentProfileId}
        senderNameLookup={senderNameLookup}
      />

      <ThreadComposer
        threadId={thread.id}
        defaultChannel={thread.channelType}
        templates={templateOptions}
        mergeFields={mergeFields}
        threadSubject={thread.subject ?? null}
        canWrite={canWrite}
      />
      <ThreadAnalyticsSummary
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        messages={messages}
        currentProfileId={currentProfileId}
      />
    </div>
  );
}
