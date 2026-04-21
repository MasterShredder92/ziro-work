import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getContactById } from "@data/contacts";
import { listChannelsForContact } from "@/lib/crm";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav } from "../../_components";
export const dynamic = "force-dynamic";
export default async function ContactDetailPage({ params, }) {
    var _a, _b, _c;
    const { id } = await params;
    const decoded = decodeURIComponent(id);
    const tenantId = await getCRMTenantId();
    const contact = await getContactById(tenantId, decoded);
    if (!contact)
        notFound();
    const { channels } = await listChannelsForContact(tenantId, decoded);
    const typedLink = contact.kind === "student"
        ? `/crm/students/${contact.sourceId}`
        : contact.kind === "family"
            ? `/crm/families/${contact.sourceId}`
            : contact.kind === "teacher"
                ? `/crm/teachers/${contact.sourceId}`
                : contact.kind === "lead"
                    ? `/crm/contacts/${encodeURIComponent(`lead:${contact.sourceId}`)}`
                    : null;
    return (_jsxs(CRMLayout, { title: contact.fullName, subtitle: `${contact.kind} · ${(_a = contact.status) !== null && _a !== void 0 ? _a : "—"}`, actions: typedLink ? (_jsx(Link, { href: typedLink, className: "rounded-md bg-[#00ff88]/10 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20", children: "Open full profile" })) : null, children: [_jsx(CRMNav, { current: "contacts" }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-3", children: [_jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[#d4d4d4]", children: "Overview" }), _jsxs("dl", { className: "space-y-2 text-sm", children: [_jsx(Row, { label: "Email", value: contact.email }), _jsx(Row, { label: "Phone", value: contact.phone }), _jsx(Row, { label: "Kind", value: contact.kind }), _jsx(Row, { label: "Source", value: (_b = contact.source) !== null && _b !== void 0 ? _b : null }), _jsx(Row, { label: "Status", value: (_c = contact.status) !== null && _c !== void 0 ? _c : null }), _jsx(Row, { label: "Created", value: contact.createdAt ? contact.createdAt.slice(0, 10) : null }), _jsx(Row, { label: "Updated", value: contact.updatedAt ? contact.updatedAt.slice(0, 10) : null })] })] }), _jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[#d4d4d4]", children: "Communication" }), channels.length === 0 ? (_jsx("div", { className: "text-xs text-[#707078]", children: "No channels available." })) : (_jsx("ul", { className: "space-y-2 text-sm", children: channels.map((c, i) => (_jsxs("li", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs uppercase tracking-wider text-[#606068]", children: c.kind }), _jsx("span", { className: "text-[#d4d4d4]", children: "address" in c ? c.address : c.number })] }, i))) }))] }), _jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[#d4d4d4]", children: "Linked" }), _jsxs("ul", { className: "space-y-2 text-sm", children: [contact.familyId ? (_jsx("li", { children: _jsx(Link, { href: `/crm/families/${contact.familyId}`, className: "text-[#00ff88] hover:underline", children: "View family \u2192" }) })) : (_jsx("li", { className: "text-xs text-[#707078]", children: "No linked family." })), contact.teacherId ? (_jsx("li", { children: _jsx(Link, { href: `/crm/teachers/${contact.teacherId}`, className: "text-[#00ff88] hover:underline", children: "View teacher \u2192" }) })) : null] })] })] }), _jsx("h2", { className: "mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]", children: "Timeline" }), _jsx("div", { className: "rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]", children: "Activity timeline will appear here as messages, sessions, and progress events are logged against this contact." })] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex items-center justify-between border-b border-[#14141a] pb-1 last:border-0", children: [_jsx("dt", { className: "text-xs uppercase tracking-wider text-[#606068]", children: label }), _jsx("dd", { className: "text-[#d4d4d4]", children: value !== null && value !== void 0 ? value : "—" })] }));
}
