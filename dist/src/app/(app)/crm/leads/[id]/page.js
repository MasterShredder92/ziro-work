import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@data/leads";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav } from "../../_components";
export const dynamic = "force-dynamic";
export default async function LeadDetailPage({ params, }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const { id } = await params;
    const tenantId = await getCRMTenantId();
    const lead = await getLeadById(id, tenantId);
    if (!lead)
        notFound();
    return (_jsxs(CRMLayout, { title: `${lead.first_name} ${(_a = lead.last_name) !== null && _a !== void 0 ? _a : ""}`.trim(), subtitle: `Lead · ${(_b = lead.stage) !== null && _b !== void 0 ? _b : "—"}`, actions: _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Link, { href: `/crm/contacts/${encodeURIComponent(`lead:${lead.id}`)}`, className: "rounded-md border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-1.5 text-sm font-semibold text-[#d4d4d4] hover:bg-white/5", children: "Unified contact" }), _jsx(Link, { href: `/schedule?intent=followup&leadId=${encodeURIComponent(lead.id)}`, className: "rounded-md bg-[#00ff88]/10 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20", children: "Schedule follow-up" })] }), children: [_jsx(CRMNav, { current: "leads" }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[#d4d4d4]", children: "Details" }), _jsxs("dl", { className: "space-y-2 text-sm", children: [_jsx(Row, { label: "Email", value: (_c = lead.email) !== null && _c !== void 0 ? _c : null }), _jsx(Row, { label: "Phone", value: (_d = lead.phone) !== null && _d !== void 0 ? _d : null }), _jsx(Row, { label: "Stage", value: (_e = lead.stage) !== null && _e !== void 0 ? _e : null }), _jsx(Row, { label: "Source", value: (_f = lead.source) !== null && _f !== void 0 ? _f : null }), _jsx(Row, { label: "Instrument", value: (_g = lead.instrument) !== null && _g !== void 0 ? _g : null })] })] }), _jsxs("div", { className: "rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[#d4d4d4]", children: "Conversion" }), lead.converted_student_id ? (_jsx("div", { className: "text-sm", children: _jsx(Link, { href: `/crm/students/${lead.converted_student_id}`, className: "font-semibold text-[#00ff88] hover:underline", children: "View student profile \u2192" }) })) : (_jsx("p", { className: "text-xs text-[#707078]", children: "Not yet converted. Use the pipeline board to convert to a student." }))] })] })] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex items-center justify-between border-b border-[#14141a] pb-1 last:border-0", children: [_jsx("dt", { className: "text-xs uppercase tracking-wider text-[#606068]", children: label }), _jsx("dd", { className: "text-[#d4d4d4]", children: value !== null && value !== void 0 ? value : "—" })] }));
}
