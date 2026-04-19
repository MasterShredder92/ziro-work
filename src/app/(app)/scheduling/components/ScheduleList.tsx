"use client";

import type { ReactNode } from "react";
import type { Schedule } from "@/lib/scheduling/types";
import { EmptyState } from "@/components/system/SurfaceStates";
import { SCHEDULING_ACCENT_HEX } from "@/lib/scheduling/colorSemantics";

type ScheduleListProps = {
  schedules: Schedule[];
  activeScheduleId: string | null;
  appointmentsTodayBySchedule: Record<string, number>;
  onSelect: (scheduleId: string) => void;
  children?: ReactNode;
};

export function ScheduleList({
  schedules,
  activeScheduleId,
  appointmentsTodayBySchedule,
  onSelect,
  children,
}: ScheduleListProps) {
  return (
    <aside className="w-full border-b border-[var(--z-border)] bg-[var(--z-surface)] md:w-72 md:border-b-0 md:border-r">
      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Schedules
      </div>
      <div className="space-y-1 px-2 pb-3">
        {schedules.map((schedule) => {
          const active = schedule.id === activeScheduleId;
          return (
            <button
              key={schedule.id}
              type="button"
              onClick={() => onSelect(schedule.id)}
              className={[
                "w-full rounded-md border px-3 py-2 text-left transition-colors",
                active
                  ? "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_88%)]"
                  : "border-[var(--z-border)] hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="truncate text-sm font-medium text-[var(--z-fg)]">{schedule.name}</div>
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    active ? "" : "bg-[var(--z-muted)]/40",
                  ].join(" ")}
                  style={active ? { backgroundColor: schedule.color || SCHEDULING_ACCENT_HEX } : undefined}
                  aria-hidden
                />
              </div>
              <div className="mt-1 text-[11px] text-[var(--z-muted)]">
                Today: {appointmentsTodayBySchedule[schedule.id] ?? 0} appointments
              </div>
            </button>
          );
        })}
        {schedules.length === 0 ? (
          <EmptyState
            className="px-3 py-4"
            title="No schedules found"
            description="Create your first schedule to start managing calendar blocks."
          />
        ) : null}
      </div>
      {children ? <div className="border-t border-[var(--z-border)] p-2">{children}</div> : null}
    </aside>
  );
}
