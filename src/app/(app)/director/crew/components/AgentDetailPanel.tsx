"use client";

import { useState } from "react";
import type { AgentStats, AgentEvent } from "@/lib/agents/types";

function formatCurrency(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usd);
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTotalDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatEventType(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idle: "bg-white/5 text-[var(--z-muted)] border-[var(--z-border)]",
    running: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 animate-pulse",
    complete: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    failed: "bg-red-500/15 text-red-300 border-red-500/30",
    stub: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    alive: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status] ?? styles.idle}`}>
      {status}
    </span>
  );
}

function TaskRow({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[var(--z-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[var(--z-fg)] truncate">
              {formatEventType(event.event_type)}
            </span>
            <StatusPill status={event.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--z-muted)]">
            <span>{formatDuration(event.duration_ms)}</span>
            <span>{formatCurrency(event.cost_usd)}</span>
            <span>{formatRelativeTime(event.created_at)}</span>
          </div>
        </div>
        <span className={`text-[var(--z-muted)] transition-transform text-xs ${expanded ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--z-border)] space-y-3">
          {event.input_summary && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold mb-1">
                What triggered this
              </div>
              <div className="text-xs text-[var(--z-fg)] bg-white/5 rounded p-2 font-mono break-all">
                {event.input_summary}
              </div>
            </div>
          )}
          {event.output_summary && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold mb-1">
                What happened
              </div>
              <div className="text-xs text-[var(--z-fg)] bg-white/5 rounded p-2 font-mono break-all">
                {event.output_summary}
              </div>
            </div>
          )}
          {event.status === "failed" && event.error_message && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
              <div className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">Error</div>
              <div className="text-xs text-red-300 font-mono break-all">{event.error_message}</div>
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-[var(--z-muted)]">
            <span>Duration: <span className="text-[var(--z-fg)]">{formatDuration(event.duration_ms)}</span></span>
            <span>Cost: <span className="text-[var(--z-fg)]">{formatCurrency(event.cost_usd)}</span></span>
          </div>
          <div className="text-[10px] text-[var(--z-muted)] font-mono break-all">
            ID: {event.event_id}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentDetailPanel({
  stats,
  onClose,
}: {
  stats: AgentStats;
  onClose: () => void;
}) {
  const [showToast, setShowToast] = useState(false);
  const { config, status, tasksThisMonth, totalDurationMs, totalCostUsd, lastActiveAt, recentEvents } = stats;

  function handleEditClick() {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--z-bg)] border-l border-[var(--z-border)] z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-[var(--z-border)]">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-black shrink-0"
            style={{ backgroundColor: config.color }}
          >
            {config.name.slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-[var(--z-fg)]">{config.name}</span>
              <StatusPill status={status} />
            </div>
            <div className="text-sm text-[var(--z-muted)]">{config.title}</div>
            <div className="text-xs text-[var(--z-muted)] mt-1">${config.hourlyRate}/hr</div>
            <div className="text-xs text-[var(--z-muted)] mt-1 leading-relaxed">{config.description}</div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors text-xl leading-none shrink-0"
          >
            ×
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-0 border-b border-[var(--z-border)]">
          {[
            { label: "Tasks", value: String(tasksThisMonth) },
            { label: "Time worked", value: formatTotalDuration(totalDurationMs) },
            { label: "Saved", value: formatCurrency(totalCostUsd) },
            { label: "Last active", value: formatRelativeTime(lastActiveAt) },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-3 border-r border-[var(--z-border)] last:border-r-0">
              <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">{stat.label}</div>
              <div className="text-sm font-semibold text-[var(--z-fg)] mt-0.5">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold mb-3">
            Recent Tasks ({recentEvents.length})
          </div>
          {recentEvents.length === 0 ? (
            <div className="text-sm text-[var(--z-muted)] text-center py-8">
              No tasks run yet for this period.
            </div>
          ) : (
            recentEvents.map((event) => (
              <TaskRow key={event.id} event={event} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--z-border)]">
          <button
            onClick={handleEditClick}
            className="w-full py-2.5 rounded-lg border border-[#00ff88]/40 text-[#00ff88] text-sm font-semibold hover:bg-[#00ff88]/10 transition-colors"
          >
            Edit agent
          </button>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[60] bg-[var(--z-surface)] border border-[var(--z-border)] rounded-lg px-4 py-3 text-sm text-[var(--z-fg)] shadow-xl">
          Agent editing coming in Phase 5
        </div>
      )}
    </>
  );
}
