import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { listLeads } from "@data/leads";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav } from "../_components";
import { LEAD_KANBAN_STAGES, LeadKanbanBoard } from "./_client";
export const dynamic = "force-dynamic";
function groupLeadsByStage(rows) {
    var _a;
    const out = {};
    for (const s of LEAD_KANBAN_STAGES)
        out[s] = [];
    const fallback = LEAD_KANBAN_STAGES[0];
    const known = LEAD_KANBAN_STAGES;
    for (const l of rows) {
        const raw = (_a = l.stage) !== null && _a !== void 0 ? _a : fallback;
        const stage = known.includes(raw) ? raw : fallback;
        out[stage].push(l);
    }
    return out;
}
export default async function LeadPipelinePage() {
    const tenantId = await getCRMTenantId();
    const leads = await listLeads(tenantId, undefined, { limit: 500 });
    const grouped = groupLeadsByStage(leads);
    return (_jsxs(CRMLayout, { title: "Lead Pipeline", subtitle: "Move stages, convert prospects, and schedule follow-ups.", children: [_jsx(CRMNav, { current: "leads" }), _jsx(LeadKanbanBoard, { grouped: grouped })] }));
}
