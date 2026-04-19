import { listLeads } from "@data/leads";
import type { Lead } from "@/lib/types/crm";
import { getCRMTenantId } from "../_tenant";
import { CRMLayout, CRMNav } from "../_components";
import { LEAD_KANBAN_STAGES, LeadKanbanBoard } from "./_client";

export const dynamic = "force-dynamic";

function groupLeadsByStage(rows: Lead[]): Record<string, Lead[]> {
  const out: Record<string, Lead[]> = {};
  for (const s of LEAD_KANBAN_STAGES) out[s] = [];
  const fallback = LEAD_KANBAN_STAGES[0];
  const known = LEAD_KANBAN_STAGES as readonly string[];
  for (const l of rows) {
    const raw = (l.stage as string | null) ?? fallback;
    const stage = known.includes(raw) ? raw : fallback;
    out[stage].push(l);
  }
  return out;
}

export default async function LeadPipelinePage() {
  const tenantId = await getCRMTenantId();
  const leads = await listLeads(tenantId, undefined, { limit: 500 });
  const grouped = groupLeadsByStage(leads);

  return (
    <CRMLayout
      title="Lead Pipeline"
      subtitle="Move stages, convert prospects, and schedule follow-ups."
    >
      <CRMNav current="leads" />
      <LeadKanbanBoard grouped={grouped} />
    </CRMLayout>
  );
}
