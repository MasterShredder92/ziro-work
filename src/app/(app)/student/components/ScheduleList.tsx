import type { StudentScheduleItem } from "@/lib/student/types";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";

export interface ScheduleListProps {
  schedule: StudentScheduleItem[];
  emptyLabel?: string;
  maxRows?: number;
}

export function ScheduleList({
  schedule,
  emptyLabel = "No upcoming lessons scheduled.",
  maxRows,
}: ScheduleListProps) {
  return (
    <PortalScheduleList
      title="Schedule"
      emptyLabel={emptyLabel}
      maxRows={maxRows}
      rows={schedule.map((b) => ({
        id: b.id,
        blockDate: b.block_date,
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status,
        room: b.room,
        isVirtual: b.is_virtual,
        blockType: b.block_type ?? "lesson",
      }))}
    />
  );
}
