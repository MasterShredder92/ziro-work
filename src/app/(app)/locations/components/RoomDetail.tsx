import Link from "next/link";
import type { RoomSurfaceData } from "@/lib/locations/types";
import { roomDisplayName } from "@/lib/rooms/roomDisplayName";

interface RoomDetailProps {
  data: RoomSurfaceData;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
    </div>
  );
}

export function RoomDetail({ data }: RoomDetailProps) {
  const { room, location, summary } = data;
  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Room surface
        </p>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          {roomDisplayName(room.name)}
        </h1>
        {room.name !== roomDisplayName(room.name) ? (
          <p className="text-[11px] text-[var(--z-muted)]">
            Registry name: <span className="font-mono text-[var(--z-fg)]">{room.name}</span>
          </p>
        ) : null}
        {location ? (
          <p className="text-sm text-[var(--z-muted)]">
            At{" "}
            <Link
              className="text-[var(--z-accent)] hover:underline"
              href={`/locations/${location.id}`}
            >
              {location.name}
            </Link>
            {room.room_type ? ` · ${room.room_type}` : ""}
            {room.floor ? ` · Floor ${room.floor}` : ""}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Blocks" value={summary.totalBlocks} />
        <Stat label="Utilization" value={`${summary.utilizationPct}%`} />
        <Stat label="Teachers" value={summary.uniqueTeacherCount} />
        <Stat label="Students" value={summary.uniqueStudentCount} />
      </div>
    </section>
  );
}
