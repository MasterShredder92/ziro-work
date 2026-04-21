import { jsx as _jsx } from "react/jsx-runtime";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
export function ScheduleList({ schedule, title = "Schedule", maxRows = 20, onlyToday = false, emptyLabel = "No lessons scheduled.", }) {
    return (_jsx(PortalScheduleList, { title: title, maxRows: maxRows, onlyToday: onlyToday, emptyLabel: emptyLabel, rows: schedule.map((b) => {
            var _a;
            return ({
                id: b.id,
                subject: (_a = b.student_name) !== null && _a !== void 0 ? _a : "Studio block",
                blockDate: b.block_date,
                startTime: b.start_time,
                endTime: b.end_time,
                status: b.status,
                room: b.room,
                isVirtual: b.is_virtual,
                blockType: b.block_type,
            });
        }) }));
}
