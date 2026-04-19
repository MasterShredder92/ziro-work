import { getCRMTenantId } from "./_tenant";
import { CRMNav } from "./_components";
import { CRMKpiSection } from "./_kpi-section";
import { CRMRecentContacts } from "./_recent-contacts";

export async function CRMDashboardBody() {
  const tenantId = await getCRMTenantId();

  return (
    <>
      <CRMNav current="home" />
      <CRMKpiSection tenantId={tenantId} />

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--z-muted,#909098)]">
        Recent activity
      </h2>
      <CRMRecentContacts tenantId={tenantId} />
    </>
  );
}
