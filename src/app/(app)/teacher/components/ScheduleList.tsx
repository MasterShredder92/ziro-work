import type { ScheduleBlock } from "@/lib/types/entities";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";

interface ScheduleListProps {
  schedule: ScheduleBlock[];
  title?: string;
  maxRows?: number;
  onlyToday?: boolean;
}

export function ScheduleList({
  schedule,
  title = "Schedule",
  maxRows = 20,
  onlyToday = false,
}: ScheduleListProps) {
  return (
    <PortalScheduleList
      title={title}
      maxRows={maxRows}
      onlyToday={onlyToday}
      emptyLabel="No scheduled blocks."
      rows={schedule.map((b) => ({
        id: b.id,
        blockDate: b.block_date,
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status,
        room: b.room_id,
        isVirtual: b.is_virtual,
        blockType: b.checked_in ? `${b.block_type ?? "lesson"} · checked in` : b.block_type ?? "lesson",
      }))}
    />
  );
}
