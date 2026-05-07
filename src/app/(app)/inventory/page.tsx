import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getInventoryDashboard } from "@/lib/inventory/service";
import {
  CheckoutList,
  InventoryList,
  MaintenanceList,
} from "./components";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold ${accent ?? "text-[var(--z-fg)]"}`}
      >
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function InventoryDashboardPage() {
  let session;
  try {
    session = await requirePermission("inventory.read")();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
        <p className="mt-2 text-sm text-[var(--z-muted)]">
          You do not have permission to view inventory.
        </p>
      </div>
    );
  }

  const tenantId = session.tenantId ?? DEFAULT_TENANT_ID;
  try {
    await assertTenantAccess(tenantId);
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
      </div>
    );
  }

  const data = await getInventoryDashboard(tenantId);

  await logAudit("inventory.dashboard.view", {
    tenantId,
    profileId: session.userId,
    generatedAt: data.generatedAt,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <section id="overview" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="Total items"
          value={data.kpis.totalItems}
          sublabel={`${data.kpis.totalQuantity} units tracked`}
        />
        <Kpi
          label="In use"
          value={data.kpis.itemsInUse}
          sublabel={`${data.kpis.activeCheckouts} active checkouts`}
          accent="text-sky-300"
        />
        <Kpi
          label="Overdue"
          value={data.kpis.overdueCheckouts}
          sublabel={`${data.kpis.itemsMaintenance} in maintenance`}
          accent={
            data.kpis.overdueCheckouts > 0 ? "text-rose-300" : undefined
          }
        />
        <Kpi
          label="Current value"
          value={formatCurrency(data.kpis.totalCurrentValue)}
          sublabel={`Depreciated ${formatCurrency(
            data.kpis.depreciationToDate,
          )}`}
          accent="text-[#c4f036]"
        />
      </section>

      <section id="items" className="space-y-2">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--z-fg)]">
            Inventory
          </h2>
          <div className="text-xs text-[var(--z-muted)]">
            {data.kpis.maintenanceDue} maintenance due ·{" "}
            {data.kpis.lowStockItems} low stock
          </div>
        </header>
        <InventoryList items={data.items} />
      </section>

      <section id="checkouts" className="space-y-2">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--z-fg)]">
            Overdue checkouts
          </h2>
        </header>
        <CheckoutList
          checkouts={data.overdue}
          maxRows={20}
          showItem
          emptyMessage="No overdue checkouts."
        />
      </section>

      <section id="maintenance" className="space-y-2">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--z-fg)]">
            Maintenance due
          </h2>
        </header>
        <MaintenanceList
          maintenance={data.maintenanceDue}
          showItem
          maxRows={20}
          emptyMessage="No scheduled maintenance."
        />
      </section>
    </div>
  );
}
