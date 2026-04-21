import { jsx as _jsx } from "react/jsx-runtime";
import { PortalMessageList } from "@/components/portals/PortalMessageList";
function conversationTitle(c) {
    var _a, _b, _c, _d;
    const meta = (_a = c["metadata"]) !== null && _a !== void 0 ? _a : {};
    const t = (_b = meta["title"]) !== null && _b !== void 0 ? _b : "";
    if (t.trim())
        return t;
    const source = (_c = c["source"]) !== null && _c !== void 0 ? _c : "chat";
    const route = (_d = c["client_route"]) !== null && _d !== void 0 ? _d : "";
    return route ? `${source} · ${route}` : source;
}
function conversationPreview(c) {
    var _a, _b, _c;
    const meta = (_a = c["metadata"]) !== null && _a !== void 0 ? _a : {};
    const preview = (_c = (_b = meta["last_message"]) !== null && _b !== void 0 ? _b : meta["preview"]) !== null && _c !== void 0 ? _c : "";
    return preview.trim();
}
export function MessageList({ messages, title = "Messages", maxRows = 10, }) {
    return (_jsx(PortalMessageList, { title: title, maxRows: maxRows, rows: messages.map((c) => {
            var _a;
            return ({
                id: c.id,
                title: conversationTitle(c),
                preview: conversationPreview(c) || null,
                updatedAt: (_a = c.updated_at) !== null && _a !== void 0 ? _a : c.created_at,
            });
        }) }));
}
