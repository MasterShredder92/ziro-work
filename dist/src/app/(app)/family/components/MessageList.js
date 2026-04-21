import { jsx as _jsx } from "react/jsx-runtime";
import { PortalMessageList } from "@/components/portals/PortalMessageList";
export function MessageList({ messages, title = "Messages", maxRows = 10 }) {
    return (_jsx(PortalMessageList, { title: title, maxRows: maxRows, rows: messages.map((m) => {
            var _a, _b;
            return ({
                id: m.id,
                title: m.title,
                preview: (_a = m.preview) !== null && _a !== void 0 ? _a : null,
                updatedAt: (_b = m.updated_at) !== null && _b !== void 0 ? _b : m.created_at,
            });
        }) }));
}
