import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { listExportJobs } from "@/lib/reports/exportService";
import { ExportHistoryTable } from "../components/ExportHistoryTable";

export const dynamic = "force-dynamic";

export default async function ExportHistoryPage() {
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

  const jobs = session ? await listExportJobs(tenantId, { limit: 100 }).catch(() => []) : [];

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Reporting OS
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          Export history
        </h1>
        <p className="text-sm text-[var(--z-muted)] max-w-[720px]">
          Every CSV, XLSX, and PDF export queued for this tenant. Files are
          retained for 24 hours after completion.
        </p>
      </section>

      <ExportHistoryTable jobs={jobs} tenantId={tenantId} />
    </div>
  );
}
