import { jsx as _jsx } from "react/jsx-runtime";
import { PortalMessageList } from "@/components/portals/PortalMessageList";
export function MessageList({ messages, emptyLabel = "No messages yet.", maxRows, }) {
    return (_jsx(PortalMessageList, { title: "Messages", maxRows: maxRows, emptyLabel: emptyLabel, rows: messages.map((m) => {
            var _a, _b;
            return ({
                id: m.id,
                title: m.title,
                preview: (_a = m.preview) !== null && _a !== void 0 ? _a : null,
                subtitle: (_b = m.source) !== null && _b !== void 0 ? _b : null,
                updatedAt: m.updated_at,
            });
        }) }));
}
