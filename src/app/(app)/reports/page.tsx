import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { listReports } from "@/lib/reports/service";
import { listSavedReports } from "@/lib/reports/savedReports";
import { computeSnapshot } from "@/lib/reports/kpis";
import { ReportList } from "./components/ReportList";
import { SavedReportList } from "./components/SavedReportList";
import { KpiSnapshotGrid } from "./components/KpiSnapshotGrid";

export const dynamic = "force-dynamic";

export default async function ReportsIndexPage() {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await requirePermission("reports.read")();
  } catch {
    session = null;
  }

  const tenantId = session?.tenantId ?? DEFAULT_TENANT_ID;

  if (session) {
    try {
      await assertTenantAccess(tenantId);
    } catch {
      return (
        <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
          <div className="text-base font-semibold text-[var(--z-fg)]">
            Forbidden
          </div>
          <div className="mt-2 text-sm text-[var(--z-muted)]">
            You do not have access to reports for this tenant.
          </div>
        </div>
      );
    }
  }

  const reports = await listReports();
  const saved = session
    ? await listSavedReports(tenantId).catch(() => [])
    : [];

  const snapshot = session
    ? await computeSnapshot(tenantId).catch(
        () => ({ tenantId, range: { from: "", to: "" }, values: [], generatedAt: new Date().toISOString() }),
      )
    : { tenantId, range: { from: "", to: "" }, values: [], generatedAt: new Date().toISOString() };

  await logAudit("reports.list.view", {
    tenantId,
    profileId: session?.userId ?? null,
    count: reports.length,
    savedCount: saved.length,
    kpiCount: snapshot.values.length,
  });

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Reporting OS
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
              Reports & analytics
            </h1>
            <p className="text-sm text-[var(--z-muted)] max-w-[640px]">
              KPIs, built-in reports, saved dashboards, and exports — all scoped
              to your tenant with audited runs.
            </p>
          </div>
          <Link
            href="/reports/builder"
            className="inline-flex h-9 items-center rounded-[var(--z-radius-md)] bg-[#c4f036] px-3 text-xs font-semibold text-black hover:bg-[#00e077]"
          >
            New custom report
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">KPI snapshot</h2>
          <span className="text-[11px] text-[var(--z-muted)]">
            Last 90 days · generated {new Date(snapshot.generatedAt).toLocaleString()}
          </span>
        </div>
        <KpiSnapshotGrid values={snapshot.values} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">Built-in reports</h2>
        <ReportList reports={reports} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">Saved reports</h2>
        </div>
        <SavedReportList reports={saved} />
      </section>
    </div>
  );
}
