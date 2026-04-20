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
import { FamilyEditClient } from "./_edit-client";

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

      {/* KPI tiles */}
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

      {/* Client-side edit component (tabs: View / Edit) */}
      <FamilyEditClient
        family={family as Record<string, unknown>}
        tenantId={tenantId}
        students={students as unknown as Array<Record<string, unknown>>}
        locationNameById={locationNameById}
        familyFileRows={familyFileRows as unknown as Array<Record<string, unknown>>}
        familyEnrollments={familyEnrollments as unknown as Array<Record<string, unknown>>}
      />
    </CRMLayout>
  );
}
