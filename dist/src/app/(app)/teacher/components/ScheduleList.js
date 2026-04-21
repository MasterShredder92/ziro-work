import { jsx as _jsx } from "react/jsx-runtime";
import { PortalScheduleList } from "@/components/portals/PortalScheduleList";
export function ScheduleList({ schedule, title = "Schedule", maxRows = 20, onlyToday = false, }) {
    return (_jsx(PortalScheduleList, { title: title, maxRows: maxRows, onlyToday: onlyToday, emptyLabel: "No scheduled blocks.", rows: schedule.map((b) => {
            var _a, _b;
            return ({
                id: b.id,
                blockDate: b.block_date,
                startTime: b.start_time,
                endTime: b.end_time,
                status: b.status,
                room: b.room,
                isVirtual: b.is_virtual,
                blockType: b.checked_in ? `${(_a = b.block_type) !== null && _a !== void 0 ? _a : "lesson"} · checked in` : (_b = b.block_type) !== null && _b !== void 0 ? _b : "lesson",
            });
        }) }));
}
