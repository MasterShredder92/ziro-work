import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";
import { getSavedReport } from "@/lib/reports/savedReports";
import { runQuery } from "@/lib/reports/queryEngine";
import { PivotTable } from "../../components/charts/PivotTable";
import { SavedReportActions } from "../../components/SavedReportActions";
import { WidgetRenderer } from "../../components/WidgetRenderer";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function SavedReportViewer({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

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
      session = null;
    }
  }

  const loaded = await getSavedReport(id, tenantId).catch(() => null);
  if (!loaded) notFound();

  const { report, widgets } = loaded;

  const preview = report.query
    ? await runQuery(report.query, tenantId).catch(() => null)
    : null;

  await logAudit("reports.viewer.saved", {
    tenantId,
    profileId: session?.userId ?? null,
    reportId: report.id,
    widgets: widgets.length,
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-[var(--z-muted)]">
          <Link href="/reports" className="hover:text-[var(--z-fg)] transition-colors">
            Reports
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--z-fg)]">{report.name}</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
              {report.name}
            </h1>
            {report.description ? (
              <p className="text-sm text-[var(--z-muted)] max-w-[720px]">
                {report.description}
              </p>
            ) : null}
          </div>
          <SavedReportActions report={report} tenantId={tenantId} />
        </div>
      </section>

      {widgets.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {widgets.map((w) => (
            <WidgetRenderer key={w.id} widget={w} tenantId={tenantId} />
          ))}
        </section>
      ) : null}

      {preview ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--z-fg)]">Data preview</h2>
            <span className="text-[11px] text-[var(--z-muted)]">
              {preview.rows.length} of {preview.totalRows} rows · {preview.durationMs}ms
            </span>
          </div>
          <PivotTable columns={preview.columns} rows={preview.rows} />
        </section>
      ) : (
        <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]">
          This report has no query configured yet.
        </div>
      )}
    </div>
  );
}
