import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getWorkflowSurface } from "@/lib/automation/workflows/service";
import { RunList, WorkflowEditor } from "../../components/workflows";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  let session;
  try {
    session = await requirePermission("automation.read")();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
      </div>
    );
  }

  const tenantId = session.tenantId || DEFAULT_TENANT_ID;
  try {
    await assertTenantAccess(tenantId);
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">Forbidden</div>
      </div>
    );
  }

  const { id } = await params;
  const surface = await getWorkflowSurface(id, tenantId);
  if (!surface) notFound();

  await logAudit("automation.workflow.view", {
    tenantId,
    profileId: session.userId,
    workflowId: id,
  });

  const canWrite = canForRole(session.role, "automation.write");

  return (
    <div className="space-y-6">
      <Link
        href="/automation/workflows"
        className="inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
      >
        ← Back to workflows
      </Link>

      {canWrite ? (
        <WorkflowEditor mode="edit" workflow={surface.workflow} />
      ) : (
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
          <h1 className="text-lg font-semibold text-[var(--z-fg)]">
            {surface.workflow.name}
          </h1>
          <div className="text-xs text-[var(--z-muted)] mt-1">
            {surface.workflow.trigger?.type} · {surface.workflow.actions.length}{" "}
            action(s)
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
          Recent runs ({surface.recentRuns.length})
        </h2>
        <RunList runs={surface.recentRuns} />
      </section>
    </div>
  );
}
