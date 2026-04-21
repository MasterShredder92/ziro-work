import { jsx as _jsx } from "react/jsx-runtime";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
export function ScheduleList({ schedule, emptyLabel = "No upcoming lessons scheduled.", maxRows, }) {
    return (_jsx(PortalScheduleList, { title: "Schedule", emptyLabel: emptyLabel, maxRows: maxRows, rows: schedule.map((b) => {
            var _a;
            return ({
                id: b.id,
                blockDate: b.block_date,
                startTime: b.start_time,
                endTime: b.end_time,
                status: b.status,
                room: b.room,
                isVirtual: b.is_virtual,
                blockType: (_a = b.block_type) !== null && _a !== void 0 ? _a : "lesson",
            });
        }) }));
}
