import type { ScheduleBlock } from "@/lib/types/entities";
import { LocationSchedule } from "./LocationSchedule";

interface RoomScheduleProps {
  blocks: ScheduleBlock[];
  title?: string;
  maxRows?: number;
}

export function RoomSchedule({
  blocks,
  title = "Room schedule",
  maxRows = 20,
}: RoomScheduleProps) {
  return (
    <LocationSchedule blocks={blocks} title={title} maxRows={maxRows} />
  );
}
