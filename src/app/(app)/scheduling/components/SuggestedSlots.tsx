import type { Room, Teacher } from "@/lib/types/entities";
import type { SuggestedSlot } from "@/lib/scheduling/types";

function teacherName(teacher: Teacher | undefined): string {
  if (!teacher) return "Teacher";
  const t = teacher as unknown as {
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  };
  return (
    t.display_name ||
    `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() ||
    "Teacher"
  );
}

export function SuggestedSlots({
  suggestions,
  teachers,
  rooms,
  limit = 12,
}: {
  suggestions: SuggestedSlot[];
  teachers: Teacher[];
  rooms: Room[];
  limit?: number;
}) {
  const teacherById = new Map<string, Teacher>();
  for (const t of teachers) teacherById.set(t.id, t);
  const roomById = new Map<string, Room>();
  for (const r of rooms) roomById.set(r.id, r);

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center">
        <div className="text-sm font-semibold text-[var(--z-fg)]">
          No suggested slots
        </div>
        <div className="mt-1 text-xs text-[var(--z-muted)]">
          Try a different window or widen your criteria.
        </div>
      </div>
    );
  }

  const rows = suggestions.slice(0, limit);

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--z-border)]">
        <div className="text-sm font-semibold text-[var(--z-fg)]">
          Suggested slots
        </div>
        <div className="text-xs text-[var(--z-muted)]">
          Top {rows.length} of {suggestions.length}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
        {rows.map((s, idx) => {
          const teacher = teacherById.get(s.teacherId);
          const room = s.roomId ? roomById.get(s.roomId) : null;
          return (
            <div
              key={`${s.teacherId}-${s.blockDate}-${s.startTime}-${idx}`}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                    {teacherName(teacher)}
                  </div>
                  <div className="text-[11px] text-[var(--z-muted)] truncate">
                    {room?.name ?? (s.roomId ? s.roomId : "Any room")}
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-[#c4f036]/30 bg-[#c4f036]/10 px-2 py-0.5 text-[10px] font-semibold text-[#c4f036]">
                  {s.score}
                </span>
              </div>
              <div className="text-xs text-[var(--z-fg)]">
                {s.blockDate} · {s.startTime.slice(0, 5)}–
                {s.endTime.slice(0, 5)} · {s.durationMinutes}m
              </div>
              <div className="text-[11px] text-[var(--z-muted)]">
                {s.rationale}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
