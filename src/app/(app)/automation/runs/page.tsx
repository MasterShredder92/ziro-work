import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { listRuns } from "@/lib/automation/workflows/queries";
import { RunList } from "../components/workflows";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function RunsPage({
  searchParams,
}: {
  searchParams?: Promise<SP>;
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

  const sp: SP = (await (searchParams ?? Promise.resolve({} as SP))) ?? {};
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const triggerType = typeof sp.trigger === "string" ? sp.trigger : undefined;
  const workflowId =
    typeof sp.workflowId === "string" ? sp.workflowId : undefined;

  const runs = await listRuns(
    tenantId,
    {
      status: status as never,
      triggerType,
      workflowId,
    },
    { limit: 100 },
  );

  await logAudit("automation.runs.list", {
    tenantId,
    profileId: session.userId,
    count: runs.length,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Automation OS
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Runs
          </h1>
          <div className="text-xs text-[var(--z-muted)] mt-1">
            {runs.length} recent run{runs.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <form action="/automation/runs" method="GET" className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-[10px] text-[var(--z-muted)] mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]"
          >
            <option value="">All</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="dead_letter">Dead-letter</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-[var(--z-muted)] mb-1">
            Trigger type
          </label>
          <input
            name="trigger"
            defaultValue={triggerType ?? ""}
            className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]"
          />
        </div>
        <button
          type="submit"
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] hover:bg-white/5"
        >
          Filter
        </button>
      </form>

      <RunList runs={runs} showWorkflow />
    </div>
  );
}
