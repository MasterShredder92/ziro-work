import Link from "next/link";
import { notFound } from "next/navigation";
import { getFamilyById } from "@data/families";
import { listFilesForFamily } from "@data/familyFiles";
import { listLocations } from "@data/locations";
import { listEnrollments } from "@data/enrollments";
import {
  getFamilyBillingSummary,
  listStudentsForFamily,
} from "@/lib/crm";
import type { Family as FamilyRow } from "@/lib/types/entities";
import { rewriteMigratedSupabaseFileUrl } from "@/lib/storage/rewriteMigratedSupabaseUrl";
import { getCRMTenantId } from "../../_tenant";
import { CRMLayout, CRMNav, KpiTile, TableShell } from "../../_components";

export const dynamic = "force-dynamic";

export default async function FamilyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getCRMTenantId();
  const familyRow = (await getFamilyById(id, tenantId)) as FamilyRow | null;
  if (!familyRow) notFound();
  const family = familyRow;

  const [billing, students, locations, familyFileRows] = await Promise.all([
    getFamilyBillingSummary(tenantId, id),
    listStudentsForFamily(tenantId, id),
    listLocations(tenantId, { is_active: true }, { limit: 200 }),
    listFilesForFamily(tenantId, id),
  ]);
  const locationNameById = Object.fromEntries(
    locations.map((l) => [l.id, l.name ?? l.id]),
  );

  const studentIds = new Set(students.map((s) => s.id));
  const allEnrollments = await listEnrollments(tenantId, undefined, {
    limit: 2000,
  });
  const familyEnrollments = allEnrollments.filter((e) =>
    studentIds.has(e.student_id),
  );

  return (
    <CRMLayout
      title={family.name}
      subtitle={`Family · ${family.billing_status}`}
      actions={
        <Link
          href={`/messages?familyId=${encodeURIComponent(family.id)}`}
          className="rounded-md bg-[#00ff88]/10 px-3 py-1.5 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20"
        >
          Message family
        </Link>
      }
    >
      <CRMNav current="families" />

      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
        <KpiTile
          label="Balance"
          value={
            billing ? `$${(billing.balanceCents / 100).toFixed(2)}` : "—"
          }
        />
        <KpiTile
          label="Overdue"
          value={
            billing ? `$${(billing.overdueCents / 100).toFixed(2)}` : "—"
          }
        />
        <KpiTile label="Autopay" value={billing?.autopayEnabled ? "On" : "Off"} />
        <KpiTile label="Students" value={students.length} />
        <KpiTile
          label="Home studio"
          value={
            family.primary_location_id
              ? locationNameById[family.primary_location_id] ??
                family.primary_location_id
              : "—"
          }
        />
        <KpiTile
          label="Lifetime paid"
          value={
            billing
              ? `$${(billing.lifetimePaidCents / 100).toFixed(2)}`
              : "—"
          }
        />
        <KpiTile
          label="Military"
          value={family.is_military ? "Yes" : "No"}
        />
        <KpiTile
          label="Rate tier"
          value={
            typeof family.rate_tier === "number" && !Number.isNaN(family.rate_tier)
              ? String(family.rate_tier)
              : "—"
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">
            Primary guardian
          </h3>
          <dl className="space-y-2 text-sm">
            <Row
              label="Name"
              value={
                family.primary_contact_name ??
                family.parent_name ??
                ([family.parent_first_name, family.parent_last_name]
                  .filter(Boolean)
                  .join(" ") ||
                  null)
              }
            />
            <Row label="Email" value={family.primary_email ?? null} />
            <Row label="Phone" value={family.primary_phone ?? null} />
            <Row
              label="Emergency contact"
              value={family.emergency_contact_name ?? null}
            />
          </dl>
        </div>

        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">
            Emergency & other
          </h3>
          {family.emergency_contact_name || family.emergency_contact_phone ? (
            <dl className="space-y-2 text-sm">
              <Row
                label="Emergency contact"
                value={family.emergency_contact_name ?? null}
              />
              <Row
                label="Emergency phone"
                value={family.emergency_contact_phone ?? null}
              />
              <Row
                label="Relationship"
                value={family.emergency_contact_relationship ?? null}
              />
            </dl>
          ) : (
            <div className="text-xs text-[#707078]">
              No emergency contact on file.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-[#d4d4d4]">Students</h3>
          {students.length === 0 ? (
            <div className="text-xs text-[#707078]">No students linked.</div>
          ) : (
            <TableShell
              headers={[
                "Student",
                "Studio",
                "Teacher",
                "Rate",
                "Paid",
                "Mil.",
                "Status",
              ]}
            >
              {students.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[#14141a] last:border-0 text-sm"
                >
                  <td className="px-3 py-2 font-semibold text-[#f0f0f0]">
                    <Link
                      href={`/crm/students/${s.id}`}
                      className="hover:text-[#00ff88]"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[#909098]">
                    {s.location_id
                      ? locationNameById[s.location_id] ?? s.location_id
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-[#909098]">
                    {s.teacher_label ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-[#909098]">
                    {typeof s.rate_per_session === "number"
                      ? `$${s.rate_per_session.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-[#909098]">
                    {typeof s.total_paid === "number"
                      ? `$${s.total_paid.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-[#909098]">
                    {s.is_military ? "Yes" : "—"}
                  </td>
                  <td className="px-3 py-2 text-[#909098]">{s.status ?? "—"}</td>
                </tr>
              ))}
            </TableShell>
          )}
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Family files
      </h2>
      {familyFileRows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">
          No files linked to this family yet.
        </div>
      ) : (
        <TableShell
          headers={["Type", "Name", "Status", "Link"]}
        >
          {familyFileRows.map((f) => {
            const href = rewriteMigratedSupabaseFileUrl(f.file_url ?? "");
            return (
              <tr key={f.id} className="border-b border-[#1c1c1e] last:border-0">
                <td className="px-4 py-2 text-[#909098]">{f.file_type ?? "—"}</td>
                <td className="px-4 py-2 text-[#d4d4d4]">{f.file_name ?? "—"}</td>
                <td className="px-4 py-2 text-[#909098]">
                  {f.signwell_status ?? "—"}
                </td>
                <td className="px-4 py-2">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#00ff88] hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Active enrollments
      </h2>
      {familyEnrollments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#1c1c1e] bg-[#0a0a0c] p-4 text-sm text-[#707078]">
          No enrollments linked to students in this family.
        </div>
      ) : (
        <TableShell
          headers={["Student", "Teacher", "Status", "Start", "End"]}
        >
          {familyEnrollments.map((e) => (
            <tr key={e.id} className="border-b border-[#1c1c1e] last:border-0">
              <td className="px-4 py-2 text-[#909098]">
                <Link
                  href={`/crm/students/${e.student_id}`}
                  className="hover:text-[#00ff88]"
                >
                  {e.student_id}
                </Link>
              </td>
              <td className="px-4 py-2 text-[#909098]">
                <Link
                  href={`/crm/teachers/${e.teacher_id}`}
                  className="hover:text-[#00ff88]"
                >
                  {e.teacher_id}
                </Link>
              </td>
              <td className="px-4 py-2 text-[#909098]">{e.status}</td>
              <td className="px-4 py-2 text-[#909098]">{e.start_date ?? "—"}</td>
              <td className="px-4 py-2 text-[#909098]">{e.end_date ?? "—"}</td>
            </tr>
          ))}
        </TableShell>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[#909098]">
        Communication
      </h2>
      <TableShell headers={["Channel", "Address"]}>
        {family.primary_email ? (
          <tr>
            <td className="px-4 py-2 text-xs uppercase text-[#606068]">Email</td>
            <td className="px-4 py-2 text-[#d4d4d4]">{family.primary_email}</td>
          </tr>
        ) : null}
        {family.primary_phone ? (
          <>
            <tr>
              <td className="px-4 py-2 text-xs uppercase text-[#606068]">SMS</td>
              <td className="px-4 py-2 text-[#d4d4d4]">{family.primary_phone}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs uppercase text-[#606068]">Phone</td>
              <td className="px-4 py-2 text-[#d4d4d4]">{family.primary_phone}</td>
            </tr>
          </>
        ) : null}
      </TableShell>
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
