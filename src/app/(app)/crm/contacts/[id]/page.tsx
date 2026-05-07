import Link from "next/link";
import { notFound } from "next/navigation";
import { getContactById } from "@data/contacts";
import { listChannelsForContact } from "@/lib/crm";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav } from "../../_components";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const tenantId = await getCRMTenantId();
  const contact = await getContactById(tenantId, decoded);
  if (!contact) notFound();
  const { channels } = await listChannelsForContact(tenantId, decoded);

  const typedLink =
    contact.kind === "student"
      ? `/crm/students/${contact.sourceId}`
      : contact.kind === "family"
        ? `/crm/families/${contact.sourceId}`
        : contact.kind === "teacher"
          ? `/crm/teachers/${contact.sourceId}`
          : contact.kind === "lead"
            ? `/crm/contacts/${encodeURIComponent(`lead:${contact.sourceId}`)}`
            : null;

  return (
    <CRMLayout
      title={contact.fullName}
      subtitle={`${contact.kind} · ${contact.status ?? "—"}`}
      actions={
        typedLink ? (
          <Link
            href={typedLink}
            className="rounded-md bg-[#c4f036]/10 px-3 py-1.5 text-sm font-semibold text-[#c4f036] hover:bg-[#c4f036]/20"
          >
            Open full profile
          </Link>
        ) : null
      }
    >
      <CRMNav current="contacts" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Overview</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={contact.email} />
            <Row label="Phone" value={contact.phone} />
            <Row label="Kind" value={contact.kind} />
            <Row label="Source" value={contact.source ?? null} />
            <Row label="Status" value={contact.status ?? null} />
            <Row
              label="Created"
              value={contact.createdAt ? contact.createdAt.slice(0, 10) : null}
            />
            <Row
              label="Updated"
              value={contact.updatedAt ? contact.updatedAt.slice(0, 10) : null}
            />
          </dl>
        </div>

        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">
            Communication
          </h3>
          {channels.length === 0 ? (
            <div className="text-xs text-[#707078]">
              No channels available.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {channels.map((c, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#606068]">
                    {c.kind}
                  </span>
                  <span className="text-[#d4d4d4]">
                    {"address" in c ? c.address : c.number}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Linked</h3>
          <ul className="space-y-2 text-sm">
            {contact.familyId ? (
              <li>
                <Link
                  href={`/crm/families/${contact.familyId}`}
                  className="text-[#c4f036] hover:underline"
                >
                  View family →
                </Link>
              </li>
            ) : (
              <li className="text-xs text-[#707078]">No linked family.</li>
            )}
            {contact.teacherId ? (
              <li>
                <Link
                  href={`/crm/teachers/${contact.teacherId}`}
                  className="text-[#c4f036] hover:underline"
                >
                  View teacher →
                </Link>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Timeline
      </h2>
      <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">
        Activity timeline will appear here as messages, sessions, and progress
        events are logged against this contact.
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
