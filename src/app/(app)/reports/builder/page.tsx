import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { REPORT_SOURCES } from "@/lib/reports/types";
import { ReportBuilder } from "../components/ReportBuilder";

export const dynamic = "force-dynamic";

export default async function ReportBuilderPage() {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await requirePermission("reports.write")();
  } catch {
    session = null;
  }

  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;
  if (session) {
    try {
      await assertTenantAccess(tenantId);
    } catch {
      session = null;
    }
  }

  if (!session) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You need reports.write permission to build custom reports.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Reporting OS
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          Report builder
        </h1>
        <p className="text-sm text-[var(--z-muted)] max-w-[720px]">
          Pick a data source, filter it, group it, and preview the result. Save
          to add the report to your dashboard.
        </p>
      </section>

      <ReportBuilder tenantId={tenantId} sources={REPORT_SOURCES} />
    </div>
  );
}
