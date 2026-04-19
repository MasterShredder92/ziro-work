import { getCRMKpis } from "@/lib/crm";
import { KpiTile } from "./_components";

export async function CRMKpiSection({ tenantId }: { tenantId: string }) {
  let kpis;
  try {
    kpis = await getCRMKpis(tenantId);
  } catch (err) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-100">
        <div className="font-semibold">Could not load KPIs</div>
        <div className="mt-1 text-xs text-red-200/90">
          {err instanceof Error ? err.message : "Unexpected error"}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <KpiTile label="Active students" value={kpis.activeStudents} />
      <KpiTile label="Families" value={kpis.families} />
      <KpiTile
        label="Active enrollments"
        value={kpis.activeEnrollments}
        hint="Teacher–student enrollments marked active"
      />
      <KpiTile label="Open leads" value={kpis.openLeads} />
      <KpiTile label="Active teachers" value={kpis.activeTeachers} />
      <KpiTile
        label="Enrolled (30d)"
        value={kpis.enrolledLast30d}
        hint="New enrollments in the last 30 days"
      />
    </div>
  );
}
