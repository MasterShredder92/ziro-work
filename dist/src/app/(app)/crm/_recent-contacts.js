import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { listContacts } from "@data/contacts";
import { crmProfileHref } from "@/lib/crm";
import { EmptyState, TableShell } from "./_components";
export async function CRMRecentContacts({ tenantId }) {
    let recent;
    try {
        recent = await listContacts(tenantId, undefined, 10);
    }
    catch (err) {
        return (_jsxs("div", { className: "rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-100", children: [_jsx("div", { className: "font-semibold", children: "Could not load recent contacts" }), _jsx("div", { className: "mt-1 text-xs text-amber-200/90", children: err instanceof Error ? err.message : "Unexpected error" })] }));
    }
    if (recent.length === 0) {
        return (_jsx(EmptyState, { title: "No recent contacts", body: "New leads, students, and families will appear here." }));
    }
    return (_jsx(TableShell, { tableId: "dashboard-recent-contacts", headers: ["Name", "Kind", "Email", "Phone", "Status"], children: recent.map((c) => {
            var _a, _b, _c;
            return (_jsxs("tr", { className: "border-b border-[#1c1c1e] last:border-0 hover:bg-white/5", children: [_jsx("td", { className: "px-4 py-2 font-semibold text-[#f0f0f0]", children: _jsx(Link, { href: crmProfileHref(c.kind, c.sourceId), className: "hover:text-[#00ff88]", children: c.fullName }) }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: c.kind }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_a = c.email) !== null && _a !== void 0 ? _a : "—" }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_b = c.phone) !== null && _b !== void 0 ? _b : "—" }), _jsx("td", { className: "px-4 py-2 text-[#909098]", children: (_c = c.status) !== null && _c !== void 0 ? _c : "—" })] }, c.id));
        }) }));
}
