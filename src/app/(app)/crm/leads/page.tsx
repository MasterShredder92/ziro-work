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

  let leads: Lead[] = [];
  let fetchError: string | null = null;

  try {
    leads = await listLeads(tenantId, undefined, { limit: 500 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[crm/leads] listLeads failed:", msg);
    fetchError = msg;
  }

  const grouped = groupLeadsByStage(leads);

  return (
    <CRMLayout
      title="Lead Pipeline"
      subtitle="Move stages, convert prospects, and schedule follow-ups."
    >
      <CRMNav current="leads" />
      {fetchError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <strong>Error loading leads:</strong> {fetchError}
        </div>
      ) : null}
      <LeadKanbanBoard grouped={grouped} />
    </CRMLayout>
  );
}
