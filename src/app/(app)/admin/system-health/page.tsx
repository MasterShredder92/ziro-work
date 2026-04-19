import { headers } from "next/headers";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission } from "@/lib/auth/guards";
import { getSystemHealth } from "@/lib/admin/adminOs";
import { KpiCard } from "../components/KpiCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveTenantId(
  params: Record<string, string | string[] | undefined>,
): Promise<string> {
  const v = params.tenantId;
  const paramValue = Array.isArray(v) ? v[0] : v;
  if (paramValue && paramValue.trim()) return paramValue.trim();
  const h = await headers();
  const fromHeader = h.get("x-tenant-id");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();
  return DEFAULT_TENANT_ID;
}

export default async function SystemHealthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tenantId = await resolveTenantId(params);
  await requirePermission("admin.system_health.read")();
  const health = await getSystemHealth(tenantId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Admin OS
        </div>
        <h1 className="text-2xl font-bold text-[var(--z-fg)]">System health</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Background jobs, automation failures, and storage usage.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Automation rules"
          value={String(health.automations.totalRules)}
          sublabel={`${health.automations.activeRules} active`}
        />
        <KpiCard
          label="Recent failures"
          value={String(health.automations.recentFailures)}
          accent={health.automations.recentFailures > 0 ? "warning" : "default"}
          sublabel="Last 200 runs"
        />
        <KpiCard
          label="Audit events (24h)"
          value={String(health.auditing.last24hCount)}
          sublabel={
            health.auditing.tableAvailable
              ? "Audit table online"
              : "Fallback in-memory store"
          }
          accent={health.auditing.tableAvailable ? "default" : "warning"}
        />
        <KpiCard
          label="Storage used"
          value={`${health.storage.usedMb} MB`}
          sublabel={`Limit ${health.storage.limitMb} MB`}
        />
      </div>

      <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Snapshot</h2>
        <pre className="mt-3 max-h-[400px] overflow-auto text-xs">
{JSON.stringify(health, null, 2)}
        </pre>
      </div>
    </div>
  );
}
