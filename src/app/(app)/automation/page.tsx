import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getAutomationDashboard } from "@/lib/automation/workflows/service";
import { RunList } from "./components/workflows";
import { WorkflowList } from "./components/workflows";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${accent ?? "text-[var(--z-fg)]"}`}>
        {value}
      </div>
      {sublabel ? (
        <div className="mt-0.5 text-[11px] text-[var(--z-muted)]">
          {sublabel}
        </div>
      ) : null}
    </div>
  );
}

export default async function AutomationDashboardPage() {
  let session;
  try {
    session = await requirePermission("automation.read")();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view Automation OS.
        </div>
      </div>
    );
  }

  const tenantId = session.tenantId || DEFAULT_TENANT_ID;
  try {
    await assertTenantAccess(tenantId);
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <div className="mt-2 text-sm text-[var(--z-muted)]">
          Tenant access denied.
        </div>
      </div>
    );
  }

  const data = await getAutomationDashboard(tenantId);
  await logAudit("automation.dashboard.view", {
    tenantId,
    profileId: session.userId,
    workflows: data.workflows.length,
    runs: data.recentRuns.length,
  });

  const canWrite = canForRole(session.role, "automation.write");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Automation OS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Dashboard
          </h1>
          <div className="text-xs text-[var(--z-muted)] mt-1">
            {data.kpis.totalWorkflows} workflows · {data.kpis.activeWorkflows} active · tenant{" "}
            <span className="font-mono">{tenantId.slice(0, 8)}</span>
          </div>
        </div>
        {canWrite ? (
          <Link
            href="/automation/workflows/new"
            className="rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679]"
          >
            New workflow
          </Link>
        ) : null}
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          label="Active workflows"
          value={String(data.kpis.activeWorkflows)}
          sublabel={`${data.kpis.totalWorkflows} total`}
          accent="text-[#00ff88]"
        />
        <Kpi
          label="Runs (24h)"
          value={String(data.kpis.runsLast24h)}
          sublabel={`${data.kpis.failureCountLast24h} failed`}
        />
        <Kpi
          label="Success rate"
          value={data.kpis.runsLast24h > 0 ? `${data.kpis.successRatePct}%` : "—"}
          sublabel="24h"
          accent="text-[#00ff88]"
        />
        <Kpi
          label="Dead-letter"
          value={String(data.kpis.deadLetterCount)}
          sublabel={`avg ${data.kpis.avgDurationMs}ms`}
          accent={data.kpis.deadLetterCount > 0 ? "text-rose-300" : undefined}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
            Active workflows
          </h2>
          <Link
            href="/automation/workflows"
            className="text-xs text-[#00ff88] hover:underline"
          >
            View all →
          </Link>
        </div>
        <WorkflowList workflows={data.workflows.slice(0, 8)} canWrite={canWrite} />
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
            Recent runs
          </h2>
          <Link
            href="/automation/runs"
            className="text-xs text-[#00ff88] hover:underline"
          >
            View all →
          </Link>
        </div>
        <RunList runs={data.recentRuns.slice(0, 10)} showWorkflow />
      </section>

      {data.failures.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-300">
            Recent failures
          </h2>
          <RunList runs={data.failures.slice(0, 10)} showWorkflow />
        </section>
      ) : null}
    </div>
  );
}
