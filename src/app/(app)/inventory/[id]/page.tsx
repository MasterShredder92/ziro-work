import { notFound } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getInventoryItemSurface } from "@/lib/inventory/service";
import {
  CheckoutForm,
  CheckoutList,
  DepreciationCurve,
  InventoryDetail,
  MaintenanceForm,
  MaintenanceList,
  StockList,
} from "../components";

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

export default async function InventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session;
  try {
    session = await requirePermission("inventory.read")();
  } catch {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <div className="text-base font-semibold text-[var(--z-fg)]">
          Forbidden
        </div>
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

  const surface = await getInventoryItemSurface(id, tenantId);
  if (!surface) notFound();

  const canWrite = hasPermission(session.role, "inventory.write");

  await logAudit("inventory.item.view", {
    tenantId,
    profileId: session.userId,
    itemId: id,
    source: "page",
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/inventory"
          className="text-xs font-medium text-[var(--z-muted)] hover:text-[var(--z-fg)]"
        >
          ← All inventory
        </Link>
      </div>

      <InventoryDetail surface={surface} />

      <section id="overview" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="On hand"
          value={surface.kpis.totalOnHand}
          sublabel={`${surface.kpis.totalReserved} reserved`}
        />
        <Kpi
          label="Active checkouts"
          value={surface.kpis.activeCheckouts}
          sublabel={`${surface.kpis.overdueCheckouts} overdue`}
          accent={
            surface.kpis.overdueCheckouts > 0 ? "text-rose-300" : undefined
          }
        />
        <Kpi
          label="Open maintenance"
          value={surface.kpis.openMaintenance}
          accent={
            surface.kpis.openMaintenance > 0 ? "text-amber-300" : undefined
          }
        />
        <Kpi
          label="% value remaining"
          value={`${surface.depreciation.percentRemaining}%`}
          sublabel={`${surface.depreciation.monthsElapsed} mo elapsed`}
          accent="text-[#c4f036]"
        />
      </section>

      <section id="depreciation">
        <DepreciationCurve record={surface.depreciation} />
      </section>

      <section id="stock" className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--z-fg)]">Stock</h2>
        <StockList stock={surface.stock} />
      </section>

      <section id="checkouts" className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--z-fg)]">
          Checkouts
        </h2>
        <CheckoutList checkouts={surface.checkouts} maxRows={25} />
        {canWrite ? <CheckoutForm itemId={surface.item.id} /> : null}
      </section>

      <section id="maintenance" className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--z-fg)]">
          Maintenance log
        </h2>
        <MaintenanceList maintenance={surface.maintenance} maxRows={25} />
        {canWrite ? <MaintenanceForm itemId={surface.item.id} /> : null}
      </section>
    </div>
  );
}
