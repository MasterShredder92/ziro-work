import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { listWorkflows } from "@/lib/automation/workflows/queries";
import { WorkflowList } from "../components/workflows";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function WorkflowListPage({
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
  const statusParam = typeof sp.status === "string" ? sp.status : undefined;
  const searchParam = typeof sp.q === "string" ? sp.q : undefined;
  const triggerParam =
    typeof sp.trigger === "string" ? sp.trigger : undefined;

  const workflows = await listWorkflows(tenantId, {
    status: statusParam as never,
    search: searchParam,
    triggerType: triggerParam,
  });

  await logAudit("automation.workflows.list", {
    tenantId,
    profileId: session.userId,
    count: workflows.length,
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
            Workflows
          </h1>
          <div className="text-xs text-[var(--z-muted)] mt-1">
            {workflows.length} workflow{workflows.length === 1 ? "" : "s"} · tenant{" "}
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

      <form
        action="/automation/workflows"
        method="GET"
        className="flex flex-wrap items-end gap-2"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] text-[var(--z-muted)] mb-1">
            Search
          </label>
          <input
            name="q"
            defaultValue={searchParam ?? ""}
            className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]"
            placeholder="Name..."
          />
        </div>
        <div>
          <label className="block text-[10px] text-[var(--z-muted)] mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={statusParam ?? ""}
            className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] hover:bg-white/5"
        >
          Filter
        </button>
      </form>

      <WorkflowList workflows={workflows} canWrite={canWrite} />
    </div>
  );
}
