import type { FamilyScheduleItem } from "@/lib/family/types";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";

interface ScheduleListProps {
  schedule: FamilyScheduleItem[];
  title?: string;
  maxRows?: number;
  onlyToday?: boolean;
  emptyLabel?: string;
}

export function ScheduleList({
  schedule,
  title = "Schedule",
  maxRows = 20,
  onlyToday = false,
  emptyLabel = "No lessons scheduled.",
}: ScheduleListProps) {
  return (
    <PortalScheduleList
      title={title}
      maxRows={maxRows}
      onlyToday={onlyToday}
      emptyLabel={emptyLabel}
      rows={schedule.map((b) => ({
        id: b.id,
        subject: b.student_name ?? "Studio block",
        blockDate: b.block_date,
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status,
        room: b.room,
        isVirtual: b.is_virtual,
        blockType: b.block_type,
      }))}
    />
  );
}
