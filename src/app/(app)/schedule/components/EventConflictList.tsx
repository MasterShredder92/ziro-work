import type { ScheduleConflict } from "@/lib/schedule/types";
import { EmptyState } from "@/components/system/SurfaceStates";
import { SCHEDULING_ACCENT_HEX } from "@/lib/scheduling/colorSemantics";

function labelFor(kind: ScheduleConflict["kind"]): string {
  switch (kind) {
    case "teacher_overlap":
      return "Teacher overlap";
    case "room_overlap":
      return "Room overlap";
    case "student_overlap":
      return "Student overlap";
  }
}

export function EventConflictList({
  conflicts,
}: {
  conflicts: ScheduleConflict[];
}) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Conflicts
          </div>
          <div className="text-sm font-semibold text-[var(--z-fg)]">
            Detected overlaps
          </div>
        </div>
        <span
          className={`text-xs font-semibold ${conflicts.length > 0 ? "text-amber-300" : ""}`}
          style={conflicts.length > 0 ? undefined : { color: SCHEDULING_ACCENT_HEX }}
        >
          {conflicts.length}
        </span>
      </header>
      {conflicts.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title="No overlaps detected"
            description="This schedule window is conflict-free."
          />
        </div>
      ) : (
        <ul className="divide-y divide-[var(--z-border)]">
          {conflicts.slice(0, 25).map((c) => (
            <li key={c.id} className="px-4 py-3 flex items-start gap-3 z-hover-micro-subtle">
              <span className="mt-1 h-2 w-2 rounded-full bg-amber-400" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--z-fg)]">
                  {labelFor(c.kind)} · {c.reason}
                </div>
                <div className="text-xs text-[var(--z-muted)]">
                  {new Date(c.startTime).toLocaleString()} →{" "}
                  {new Date(c.endTime).toLocaleTimeString()}
                </div>
                <div className="text-[11px] text-[var(--z-muted)]/80 mt-0.5 truncate">
                  Events: {c.eventIds.join(" · ")}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
