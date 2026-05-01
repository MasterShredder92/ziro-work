"use client";

import { useState, useEffect, useCallback } from "react";

type OutboxMessage = {
  id: string;
  tenant_id: string;
  event_id: string;
  from_agent: string;
  channel: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  recipient_name: string | null;
  location_id: string | null;
  location_slug: string | null;
  framework_used: string | null;
  outbound_type: string | null;
  message_body: string | null;
  subject: string | null;
  status: string;
  requires_approval: boolean;
  sms_enabled: boolean;
  created_at: string;
};

const CHANNEL_COLORS: Record<string, string> = {
  sms: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
  email: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  both: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const AGENT_COLORS: Record<string, string> = {
  STAR: "text-yellow-400",
  SID: "text-pink-400",
  RUBY: "text-red-400",
  STEWIE: "text-orange-400",
  BUB: "text-green-400",
  VADER: "text-gray-400",
  ROUSEY: "text-amber-400",
  ZIRO: "text-[#00ff88]",
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

export function OutboxBoard({ tenantId }: { tenantId: string }) {
  const [messages, setMessages] = useState<OutboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/raven/outbox?tenant_id=${tenantId}&status=pending_approval`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load outbox");
      setMessages(json.messages ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

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
        body: JSON.stringify({ id, action, tenant_id: tenantId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
      showToast(
        action === "approve" ? "Message approved — RAVEN is sending." : "Message rejected.",
        "success"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setActing(null);
    }
  };

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--z-muted)] text-sm">
        Loading RAVEN Outbox...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-red-500/30 bg-[var(--z-surface)] p-8 text-center">
        <div className="text-sm font-semibold text-red-400">Failed to load outbox</div>
        <div className="mt-1 text-xs text-[var(--z-muted)]">{error}</div>
        <button
          onClick={fetchMessages}
          className="mt-4 px-4 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--z-fg)] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            RAVEN
          </div>
          <h1 className="text-xl font-bold text-[var(--z-fg)] mt-0.5">Outbox</h1>
          <div className="text-sm text-[var(--z-muted)] mt-1">
            {messages.length === 0
              ? "No messages pending approval"
              : `${messages.length} message${messages.length !== 1 ? "s" : ""} pending approval`}
          </div>
        </div>
        <button
          onClick={fetchMessages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors border border-[var(--z-border)]"
        >
          Refresh
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-12 text-center">
          <div className="text-2xl mb-3">✓</div>
          <div className="text-base font-semibold text-[var(--z-fg)]">Outbox is clear</div>
          <div className="mt-1 text-sm text-[var(--z-muted)]">
            All messages have been reviewed. RAVEN is standing by.
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* Message list */}
          <div className="flex flex-col gap-2 w-full md:w-[400px] shrink-0">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedId(msg.id === selectedId ? null : msg.id)}
                className={`w-full text-left rounded-[var(--z-radius-lg)] border p-4 transition-all ${
                  selectedId === msg.id
                    ? "border-[#00ff88]/40 bg-[#00ff88]/5"
                    : "border-[var(--z-border)] bg-[var(--z-surface)] hover:border-[var(--z-border-hover)] hover:bg-white/3"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          AGENT_COLORS[msg.from_agent] ?? "text-[var(--z-muted)]"
                        }`}
                      >
                        {msg.from_agent}
                      </span>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          CHANNEL_COLORS[msg.channel] ?? "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]"
                        }`}
                      >
                        {msg.channel}
                      </span>
                      {msg.location_slug && (
                        <span className="text-[10px] text-[var(--z-muted)] uppercase tracking-wider">
                          {msg.location_slug}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-[var(--z-fg)] truncate">
                      {msg.recipient_name || msg.recipient_phone || msg.recipient_email || "Unknown recipient"}
                    </div>
                    <div className="text-xs text-[var(--z-muted)] mt-0.5 truncate">
                      {msg.outbound_type
                        ? msg.outbound_type.replace(/_/g, " ")
                        : msg.framework_used ?? "message"}
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--z-muted)] shrink-0 mt-0.5">
                    {formatTime(msg.created_at)}
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    disabled={acting === msg.id}
                    onClick={() => handleAction(msg.id, "approve")}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {acting === msg.id ? "..." : "Approve"}
                  </button>
                  <button
                    disabled={acting === msg.id}
                    onClick={() => handleAction(msg.id, "reject")}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="flex-1 rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 self-start">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-[var(--z-fg)]">Message Preview</div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-[var(--z-muted)] hover:text-[var(--z-fg)] text-xs"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-[var(--z-muted)] w-24 shrink-0">From agent</span>
                  <span
                    className={`font-semibold ${AGENT_COLORS[selected.from_agent] ?? "text-[var(--z-fg)]"}`}
                  >
                    {selected.from_agent}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[var(--z-muted)] w-24 shrink-0">Channel</span>
                  <span className="text-[var(--z-fg)] uppercase text-xs font-semibold tracking-wider">
                    {selected.channel}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-[var(--z-muted)] w-24 shrink-0">Recipient</span>
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
                {selected.location_slug && (
                  <div className="flex gap-3">
                    <span className="text-[var(--z-muted)] w-24 shrink-0">Location</span>
                    <span className="text-[var(--z-fg)] capitalize">{selected.location_slug}</span>
                  </div>
                )}
                {selected.framework_used && (
                  <div className="flex gap-3">
                    <span className="text-[var(--z-muted)] w-24 shrink-0">Framework</span>
                    <span className="text-[var(--z-fg)] text-xs">{selected.framework_used}</span>
                  </div>
                )}
                {selected.outbound_type && (
                  <div className="flex gap-3">
                    <span className="text-[var(--z-muted)] w-24 shrink-0">Type</span>
                    <span className="text-[var(--z-fg)] text-xs">
                      {selected.outbound_type.replace(/_/g, " ")}
                    </span>
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

              <div className="flex gap-2 mt-5">
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
