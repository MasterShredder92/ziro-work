import Link from "next/link";
import type { Room } from "@/lib/types/entities";
import type { RoomScheduleSummary } from "@/lib/locations/types";

interface RoomListProps {
  rooms: Room[];
  summaries?: RoomScheduleSummary[];
}

function utilizationTint(pct: number): string {
  if (pct >= 80) return "text-[var(--z-danger,#b91c1c)]";
  if (pct >= 50) return "text-[var(--z-accent)]";
  return "text-[var(--z-muted)]";
}

export function RoomList({ rooms, summaries = [] }: RoomListProps) {
  const byRoom = new Map(summaries.map((s) => [s.roomId, s]));

  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-sm text-[var(--z-muted)]">
        No rooms configured for this location yet.
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => {
        const s = byRoom.get(room.id);
        const utilPct = s?.utilizationPct ?? 0;
        return (
          <li key={room.id}>
            <Link
              href={`/locations/rooms/${room.id}`}
              className="group flex h-full flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 transition hover:border-[var(--z-accent)]"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-[var(--z-fg)]">
                  {room.name}
                </h3>
                {room.is_active === false ? (
                  <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
                    Inactive
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[var(--z-muted)]">
                {room.room_type ?? "Room"}
                {room.floor ? ` · Floor ${room.floor}` : ""}
              </p>
              <div className="mt-auto flex items-center justify-between text-xs">
                <span className={utilizationTint(utilPct)}>
                  {utilPct}% utilized
                </span>
                <span className="text-[var(--z-accent)] group-hover:underline">
                  View →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
