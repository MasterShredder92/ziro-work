import type { Room, Teacher } from "@/lib/types/entities";
import type {
  RoomAvailability,
  TeacherAvailability,
} from "@/lib/scheduling/types";

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

function Bar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const tone =
    clamped >= 85
      ? "bg-red-500/70"
      : clamped >= 65
        ? "bg-amber-500/70"
        : "bg-[#00ff88]/70";
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--z-surface-2)] overflow-hidden">
      <div
        className={`h-full ${tone}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function AvailabilityPanel({
  teachers,
  rooms,
  teacherAvailability,
  roomAvailability,
}: {
  teachers: Teacher[];
  rooms: Room[];
  teacherAvailability: TeacherAvailability[];
  roomAvailability: RoomAvailability[];
}) {
  const teacherById = new Map<string, Teacher>();
  for (const t of teachers) teacherById.set(t.id, t);
  const roomById = new Map<string, Room>();
  for (const r of rooms) roomById.set(r.id, r);

  const sortedTeachers = [...teacherAvailability].sort(
    (a, b) => b.utilizationPct - a.utilizationPct,
  );
  const sortedRooms = [...roomAvailability].sort(
    (a, b) => b.utilizationPct - a.utilizationPct,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div className="px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--z-fg)]">
            Teacher availability
          </div>
          <div className="text-xs text-[var(--z-muted)]">
            {sortedTeachers.length} teachers
          </div>
        </div>
        <ul className="divide-y divide-[var(--z-border)]">
          {sortedTeachers.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--z-muted)] text-center">
              No teacher availability data
            </li>
          ) : (
            sortedTeachers.slice(0, 20).map((t) => (
              <li key={t.teacherId} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-[var(--z-fg)] truncate">
                    {teacherName(teacherById.get(t.teacherId))}
                  </div>
                  <div className="text-xs text-[var(--z-muted)]">
                    {t.weeklyHours.toFixed(1)}h · {t.utilizationPct}%
                  </div>
                </div>
                <Bar pct={t.utilizationPct} />
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div className="px-4 py-3 border-b border-[var(--z-border)] flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--z-fg)]">
            Room availability
          </div>
          <div className="text-xs text-[var(--z-muted)]">
            {sortedRooms.length} rooms
          </div>
        </div>
        <ul className="divide-y divide-[var(--z-border)]">
          {sortedRooms.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--z-muted)] text-center">
              No room availability data
            </li>
          ) : (
            sortedRooms.slice(0, 20).map((r) => {
              const room = roomById.get(r.roomId);
              const name = room?.name ?? r.roomId;
              const roomType = (room as unknown as { room_type?: string | null })
                ?.room_type;
              return (
                <li key={r.roomId} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--z-fg)] truncate">
                        {name}
                      </div>
                      {roomType ? (
                        <div className="text-[11px] text-[var(--z-muted)] truncate">
                          {roomType}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-xs text-[var(--z-muted)] text-right shrink-0">
                      {Math.round(r.totalMinutes / 60)}h · {r.utilizationPct}%
                    </div>
                  </div>
                  <Bar pct={r.utilizationPct} />
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
