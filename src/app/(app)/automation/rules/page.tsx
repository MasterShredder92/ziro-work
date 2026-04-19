import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { listAutomationRules } from "@/lib/automation/queries";
import { AutomationList } from "../components/AutomationList";

export const dynamic = "force-dynamic";

export default async function AutomationRulesPage() {
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

  const rules = await listAutomationRules(tenantId);

  await logAudit("automation.rules.list", {
    tenantId,
    profileId: session.userId,
    count: rules.length,
  });

  const canWrite = canForRole(session.role, "automation.write");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Legacy rules
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            Automation rules
          </h1>
          <div className="text-xs text-[var(--z-muted)] mt-1">
            {rules.length} rule{rules.length === 1 ? "" : "s"} · tenant{" "}
            <span className="font-mono">{tenantId.slice(0, 8)}</span>
          </div>
        </div>
        {canWrite ? (
          <Link
            href="/automation/new"
            className="rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679]"
          >
            New rule
          </Link>
        ) : null}
      </header>

      <AutomationList rules={rules} />
    </div>
  );
}
