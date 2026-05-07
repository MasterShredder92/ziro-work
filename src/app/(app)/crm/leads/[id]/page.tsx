import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@data/leads";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav } from "../../_components";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getCRMTenantId();
  const lead = await getLeadById(id, tenantId);
  if (!lead) notFound();

  return (
    <CRMLayout
      title={`${lead.first_name} ${lead.last_name ?? ""}`.trim()}
      subtitle={`Lead · ${lead.stage ?? "—"}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/crm/contacts/${encodeURIComponent(`lead:${lead.id}`)}`}
            className="rounded-md border border-[#1c1c1e] bg-[#0a0a0c] px-3 py-1.5 text-sm font-semibold text-[#d4d4d4] hover:bg-white/5"
          >
            Unified contact
          </Link>
          <Link
            href={`/schedule?intent=followup&leadId=${encodeURIComponent(lead.id)}`}
            className="rounded-md bg-[#c4f036]/10 px-3 py-1.5 text-sm font-semibold text-[#c4f036] hover:bg-[#c4f036]/20"
          >
            Schedule follow-up
          </Link>
        </div>
      }
    >
      <CRMNav current="leads" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Details</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={lead.email ?? null} />
            <Row label="Phone" value={lead.phone ?? null} />
            <Row label="Stage" value={lead.stage ?? null} />
            <Row label="Source" value={lead.source ?? null} />
            <Row label="Instrument" value={lead.instrument ?? null} />
          </dl>
        </div>
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Conversion</h3>
          {lead.converted_student_id ? (
            <div className="text-sm">
              <Link
                href={`/crm/students/${lead.converted_student_id}`}
                className="font-semibold text-[#c4f036] hover:underline"
              >
                View student profile →
              </Link>
            </div>
          ) : (
            <p className="text-xs text-[#707078]">
              Not yet converted. Use the pipeline board to convert to a student.
            </p>
          )}
        </div>
      </div>
    </CRMLayout>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-[#14141a] pb-1 last:border-0">
      <dt className="text-xs uppercase tracking-wider text-[#606068]">{label}</dt>
      <dd className="text-[#d4d4d4]">{value ?? "—"}</dd>
    </div>
  );
}
