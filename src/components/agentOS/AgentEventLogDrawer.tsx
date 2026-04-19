"use client";

import * as React from "react";
import { Drawer } from "@/components/ui/Drawer";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";

const EXPERIENCE_PHASES = [
  "GLOBAL-UX-POLISH",
  "PORTAL-UNIFY",
  "SCHED-CONVERGE",
  "AGENT-WIRE",
  "PROD-READY",
] as const;

function relativeTime(at: number): string {
  const delta = Date.now() - at;
  const sec = Math.max(1, Math.floor(delta / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function AgentEventLogDrawer() {
  const { eventLogOpen, closeEventLog, eventLog, clearEventLog } = useAgentOS();

  return (
    <Drawer
      open={eventLogOpen}
      onClose={closeEventLog}
      title="AgentOS event log"
    >
      <section className="space-y-3">
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
            Experience pass
          </div>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_PHASES.map((phase) => (
              <span
                key={phase}
                className="rounded-full border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--z-fg)]"
              >
                {phase}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
            Recent activity
          </h3>
          <button
            type="button"
            onClick={clearEventLog}
            className={cn(
              "rounded-[var(--z-radius-sm)] border border-[var(--z-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--z-muted)] hover:text-[var(--z-fg)]",
              focusRingClassName(),
            )}
          >
            Clear
          </button>
        </div>

        {eventLog.length === 0 ? (
          <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] p-4 text-sm text-[var(--z-muted)]">
            No events yet. Trigger an AgentOS action to populate the log.
          </div>
        ) : (
          <ul className="space-y-2">
            {eventLog.slice(0, 80).map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "rounded-[var(--z-radius-md)] border bg-[var(--z-surface-2)] p-3",
                  entry.level === "error"
                    ? "border-red-500/40"
                    : entry.level === "warning"
                      ? "border-amber-400/40"
                      : entry.level === "success"
                        ? "border-emerald-400/40"
                        : "border-[var(--z-border)]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--z-fg)]">{entry.label}</div>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--z-muted)]">
                    {relativeTime(entry.at)}
                  </span>
                </div>
                <div className="mt-1 text-xs text-[var(--z-muted)]">
                  {entry.detail ?? "Action executed"}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[var(--z-muted)]">
                  {entry.agentId} · {entry.actionId}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Drawer>
  );
}
