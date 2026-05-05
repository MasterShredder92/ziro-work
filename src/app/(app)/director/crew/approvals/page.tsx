"use client";

/**
 * /director/crew/approvals
 *
 * RAVEN Message Approval Queue — Dead Letter Queue UI
 *
 * Shows messages in these statuses:
 *   - pending_approval   → awaiting director review
 *   - send_failed        → failed, retry available
 *   - send_failed_permanent → max retries exceeded, manual action required
 *
 * Actions:
 *   - Approve → fires /api/raven/approve with action: "approve"
 *   - Reject  → fires /api/raven/approve with action: "reject"
 *   - Retry   → re-sets status to "approved" then fires /api/raven/approve
 */

import { useState, useEffect, useCallback } from "react";

type QueueMessage = {
  id: string;
  tenant_id: string;
  from_agent: string;
  channel: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  location_id: string | null;
  framework_used: string | null;
  message_body: string | null;
  subject: string | null;
  status: string;
  retry_count: number | null;
  error_message: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_approval: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  send_failed: {
    label: "Failed",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  send_failed_permanent: {
    label: "Dead Letter",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

const CHANNEL_ICONS: Record<string, string> = {
  sms: "📱",
  email: "✉️",
  both: "📡",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString();
}

const STATUSES_TO_SHOW = ["pending_approval", "send_failed", "send_failed_permanent"];

export default function ApprovalsPage() {
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [selected, setSelected] = useState<QueueMessage | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending_approval");

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      STATUSES_TO_SHOW.forEach((s) => params.append("status", s));
      const res = await fetch(`/api/raven/queue?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load queue");
      setMessages(json.messages ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      const res = await fetch("/api/raven/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast(
        action === "approve" ? "Message approved — send queued." : "Message rejected.",
        "success"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setActing(null);
    }
  };

  const handleRetry = async (id: string) => {
    setActing(id);
    try {
      // Reset to approved so the send route will process it
      const res = await fetch("/api/raven/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Retry failed");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast("Retry queued.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Retry failed", "error");
    } finally {
      setActing(null);
    }
  };

  const filtered = messages.filter((m) => m.status === activeTab);

  const counts = STATUSES_TO_SHOW.reduce(
    (acc, s) => ({ ...acc, [s]: messages.filter((m) => m.status === s).length }),
    {} as Record<string, number>
  );

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--z-fg)]">RAVEN Approval Queue</h1>
          <p className="text-sm text-[var(--z-muted)] mt-0.5">
            Review, approve, reject, or retry outbound messages
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--z-border)] hover:border-[var(--z-fg)]/20"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {STATUSES_TO_SHOW.map((s) => {
          const meta = STATUS_LABELS[s];
          const count = counts[s] ?? 0;
          return (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                activeTab === s
                  ? meta.color
                  : "bg-transparent text-[var(--z-muted)] border-[var(--z-border)] hover:text-[var(--z-fg)]"
              }`}
            >
              {meta.label}
              {count > 0 && (
                <span className="ml-1.5 bg-white/10 rounded-full px-1.5 py-0.5 text-[10px]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm text-[var(--z-muted)]">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">
              {activeTab === "pending_approval" ? "✅" : activeTab === "send_failed" ? "📭" : "🗑️"}
            </div>
            <div className="text-sm font-semibold text-[var(--z-fg)]">
              {activeTab === "pending_approval"
                ? "No messages pending approval"
                : activeTab === "send_failed"
                ? "No failed messages"
                : "Dead letter queue is empty"}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* List */}
          <div className="w-72 flex flex-col gap-2 overflow-y-auto">
            {filtered.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelected(msg)}
                className={`text-left p-3 rounded-[var(--z-radius-lg)] border transition-colors ${
                  selected?.id === msg.id
                    ? "border-[var(--z-accent)]/40 bg-[var(--z-accent)]/5"
                    : "border-[var(--z-border)] bg-[var(--z-surface)] hover:border-[var(--z-border-hover)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--z-fg)]">
                    {CHANNEL_ICONS[msg.channel] ?? "📨"} {msg.channel?.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-[var(--z-muted)]">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <div className="text-xs text-[var(--z-muted)] truncate">
                  {msg.recipient_name || msg.recipient_phone || msg.recipient_email || "Unknown"}
                </div>
                {msg.retry_count != null && msg.retry_count > 0 && (
                  <div className="text-[10px] text-orange-400 mt-1">
                    Retry {msg.retry_count}/2
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="flex-1 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-[var(--z-fg)]">Message Detail</div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-[var(--z-muted)] w-28 shrink-0">Agent</span>
                  <span className="font-semibold text-[var(--z-fg)]">{selected.from_agent}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[var(--z-muted)] w-28 shrink-0">Channel</span>
                  <span className="text-[var(--z-fg)] uppercase text-xs font-semibold tracking-wider">
                    {selected.channel}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[var(--z-muted)] w-28 shrink-0">Recipient</span>
                  <span className="text-[var(--z-fg)]">
                    {selected.recipient_name || "—"}
                    {selected.recipient_phone && (
                      <span className="ml-2 text-[var(--z-muted)]">{selected.recipient_phone}</span>
                    )}
                    {selected.recipient_email && (
                      <span className="ml-2 text-[var(--z-muted)]">{selected.recipient_email}</span>
                    )}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[var(--z-muted)] w-28 shrink-0">Status</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      STATUS_LABELS[selected.status]?.color ?? ""
                    }`}
                  >
                    {STATUS_LABELS[selected.status]?.label ?? selected.status}
                  </span>
                </div>
                {selected.retry_count != null && selected.retry_count > 0 && (
                  <div className="flex gap-3">
                    <span className="text-[var(--z-muted)] w-28 shrink-0">Retries</span>
                    <span className="text-orange-400 text-xs">{selected.retry_count} / 2</span>
                  </div>
                )}
                {selected.error_message && (
                  <div className="flex gap-3">
                    <span className="text-[var(--z-muted)] w-28 shrink-0">Error</span>
                    <span className="text-red-400 text-xs font-mono">{selected.error_message}</span>
                  </div>
                )}
                {selected.framework_used && (
                  <div className="flex gap-3">
                    <span className="text-[var(--z-muted)] w-28 shrink-0">Framework</span>
                    <span className="text-[var(--z-fg)] text-xs">{selected.framework_used}</span>
                  </div>
                )}
              </div>

              {selected.subject && (
                <div className="mt-4 pt-4 border-t border-[var(--z-border)]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-1">
                    Subject
                  </div>
                  <div className="text-sm text-[var(--z-fg)]">{selected.subject}</div>
                </div>
              )}

              {selected.message_body && (
                <div className="mt-4 pt-4 border-t border-[var(--z-border)]">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)] mb-2">
                    Message
                  </div>
                  <div className="text-sm text-[var(--z-fg)] whitespace-pre-wrap leading-relaxed bg-white/3 rounded-lg p-3 border border-[var(--z-border)]">
                    {selected.message_body}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-5">
                {selected.status === "pending_approval" && (
                  <>
                    <button
                      disabled={acting === selected.id}
                      onClick={() => handleAction(selected.id, "approve")}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {acting === selected.id ? "Processing..." : "Approve & Send"}
                    </button>
                    <button
                      disabled={acting === selected.id}
                      onClick={() => handleAction(selected.id, "reject")}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </>
                )}

                {(selected.status === "send_failed" ||
                  selected.status === "send_failed_permanent") && (
                  <>
                    <button
                      disabled={acting === selected.id}
                      onClick={() => handleRetry(selected.id)}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {acting === selected.id ? "Retrying..." : "Retry Send"}
                    </button>
                    <button
                      disabled={acting === selected.id}
                      onClick={() => handleAction(selected.id, "reject")}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-[var(--z-radius-lg)] text-sm font-medium shadow-lg border transition-all ${
            toast.type === "success"
              ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
