"use client";

import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";

export function AgentExperienceDock() {
  const { openEventLog, eventLogOpen } = useAgentOS();

  return (
    <div className="pointer-events-none fixed left-3 top-3 z-[57]">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--z-border)] bg-[var(--z-surface)]/90 px-2 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
          AgentOS
        </span>
        <button
          type="button"
          onClick={openEventLog}
          className={cn(
            "rounded-full border border-[var(--z-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--z-fg)] transition-colors hover:bg-white/5",
            eventLogOpen ? "bg-white/10" : "",
            focusRingClassName(),
          )}
        >
          Event log
        </button>
      </div>
    </div>
  );
}
