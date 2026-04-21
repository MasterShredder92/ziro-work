import { jsx as _jsx } from "react/jsx-runtime";
import { LocationSchedule } from "./LocationSchedule";
export function RoomSchedule({ blocks, title = "Room schedule", maxRows = 20, }) {
    return (_jsx(LocationSchedule, { blocks: blocks, title: title, maxRows: maxRows }));
}
