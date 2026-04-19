import type { ConflictItem } from "@/lib/scheduling/types";
import { EmptyState } from "@/components/system/SurfaceStates";

function kindLabel(kind: ConflictItem["kind"]): string {
  if (kind === "teacher_overlap") return "Teacher";
  if (kind === "room_overlap") return "Room";
  return "Student";
}

function kindTone(kind: ConflictItem["kind"]): string {
  if (kind === "teacher_overlap")
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (kind === "room_overlap")
    return "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return "bg-red-500/15 text-red-300 border-red-500/30";
}

export function ConflictList({
  conflicts,
  limit = 50,
}: {
  conflicts: ConflictItem[];
  limit?: number;
}) {
  if (!conflicts || conflicts.length === 0) {
    return (
      <EmptyState
        title="No conflicts detected"
        description="All scheduled blocks are conflict-free in this window."
      />
    );
  }

  const rows = conflicts.slice(0, limit);

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]">
        <div className="text-sm font-semibold text-[var(--z-fg)]">
          Conflicts
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          {conflicts.length} total
        </div>
      </div>
      <ul className="divide-y divide-[var(--z-border)]">
        {rows.map((c) => (
          <li key={c.id} className="px-4 py-3 flex items-start gap-3">
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${kindTone(
                c.kind,
              )}`}
            >
              {kindLabel(c.kind)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[var(--z-fg)] truncate">
                {c.reason}
              </div>
              <div className="text-xs text-[var(--z-muted)] mt-0.5">
                {c.blockDate} · {c.startTime?.slice(0, 5)}–
                {c.endTime?.slice(0, 5)}
              </div>
              <div className="text-[11px] text-[var(--z-muted)] mt-0.5 truncate">
                Blocks: {c.conflictWithBlockIds.join(" ↔ ")}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
