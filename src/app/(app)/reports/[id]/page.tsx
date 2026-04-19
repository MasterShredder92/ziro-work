import { notFound } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { logAudit } from "@/lib/audit/log";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { getReportDefinition } from "@/lib/reports/service";
import { ReportRunner } from "../components/ReportRunner";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function ReportSurfacePage({
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
      return (
        <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
          <div className="text-base font-semibold text-[var(--z-fg)]">
            Forbidden
          </div>
          <div className="mt-2 text-sm text-[var(--z-muted)]">
            You do not have access to this tenant&apos;s reports.
          </div>
        </div>
      );
    }
  }

  const definition = await getReportDefinition(id);
  if (!definition) {
    notFound();
  }

  await logAudit("reports.surface.view", {
    reportId: definition.id,
    tenantId,
    profileId: session?.userId ?? null,
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-[var(--z-muted)]">
          <Link
            href="/reports"
            className="hover:text-[var(--z-fg)] transition-colors"
          >
            Reports
          </Link>
          <span aria-hidden>/</span>
          <span className="text-[var(--z-fg)]">{definition.name}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {definition.name}
        </h1>
        <p className="text-sm text-[var(--z-muted)] max-w-[720px]">
          {definition.description}
        </p>
      </section>

      <ReportRunner definition={definition} tenantId={tenantId} />
    </div>
  );
}
