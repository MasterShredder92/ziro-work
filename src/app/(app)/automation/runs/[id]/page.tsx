import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getRunSurface } from "@/lib/automation/workflows/service";
import { RunTimeline } from "../../components/workflows";

export const dynamic = "force-dynamic";

type Params = { id: string };

function formatTs(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default async function RunDetailPage({
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
  const surface = await getRunSurface(id, tenantId);
  if (!surface) notFound();

  await logAudit("automation.run.view", {
    tenantId,
    profileId: session.userId,
    runId: id,
  });

  const { run, workflow, logs } = surface;

  return (
    <div className="space-y-6">
      <Link
        href="/automation/runs"
        className="inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]"
      >
        ← Back to runs
      </Link>

      <header className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Run
            </div>
            <h1 className="text-lg font-semibold text-[var(--z-fg)] font-mono">
              {run.id}
            </h1>
            <div className="text-xs text-[var(--z-muted)] mt-1">
              {workflow ? (
                <Link
                  href={`/automation/workflows/${workflow.id}`}
                  className="hover:text-[var(--z-fg)]"
                >
                  {workflow.name}
                </Link>
              ) : (
                <span>Workflow missing</span>
              )}{" "}
              · {run.trigger_type}
            </div>
          </div>
          <div className="text-right text-xs text-[var(--z-muted)]">
            <div>
              Status: <span className="font-semibold text-[var(--z-fg)]">{run.status}</span>
            </div>
            <div>Attempt: {run.attempt}/{run.max_attempts}</div>
            <div>Started: {formatTs(run.started_at)}</div>
            <div>Finished: {formatTs(run.finished_at)}</div>
            {typeof run.duration_ms === "number" ? (
              <div>Duration: {run.duration_ms}ms</div>
            ) : null}
          </div>
        </div>
        {run.error ? (
          <div className="mt-3 rounded-[var(--z-radius-md)] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {run.error.message}
            {run.error.code ? (
              <span className="ml-2 opacity-70">[{run.error.code}]</span>
            ) : null}
          </div>
        ) : null}
      </header>

      <RunTimeline run={run} logs={logs} />
    </div>
  );
}
