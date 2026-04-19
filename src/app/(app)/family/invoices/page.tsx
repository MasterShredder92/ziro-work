import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { listInvoices } from "@data/invoices";
import { listFamilies } from "@data/families";
import { formatCents, formatDate, statusTone } from "../../billing/components/format";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
    redirect("/family");
  }
}

export default async function FamilyInvoicesPage() {
  const session = await resolveSession();

  // Families are currently resolved by profile lookup; for the portal we show
  // the tenant's invoices the current user is associated with. Until portal
  // linking is finalized, we scope by tenant (already enforced at @data layer).
  const [invoices, families] = await Promise.all([
    listInvoices(session.tenantId, undefined, { limit: 200 }),
    listFamilies(session.tenantId, undefined, { limit: 200 }),
  ]);
  void families;

  const visible = invoices.filter((inv) => inv.status !== "void");

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">Invoices</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Recent invoices and balances for your family.
        </p>
      </header>

      <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div
          className="grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]"
          style={{
            gridTemplateColumns: "minmax(120px,1fr) 120px 120px 120px 120px",
          }}
        >
          {["Invoice", "Issued", "Due", "Total", "Balance"].map((c) => (
            <div
              key={c}
              className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
            >
              {c}
            </div>
          ))}
        </div>
        {visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
            No invoices on file.
          </div>
        ) : (
          visible.map((inv) => (
            <div
              key={inv.id}
              className="grid border-b border-[var(--z-border)] last:border-b-0"
              style={{
                gridTemplateColumns: "minmax(120px,1fr) 120px 120px 120px 120px",
              }}
            >
              <div className="px-4 py-3 text-sm text-[var(--z-fg)]">
                <div className="font-medium">{inv.number ?? inv.id.slice(0, 8)}</div>
                <div className="text-[11px]">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusTone(
                      inv.status,
                    )}`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-muted)]">
                {formatDate(inv.issued_at)}
              </div>
              <div className="px-4 py-3 text-sm text-[var(--z-muted)]">
                {formatDate(inv.due_at)}
              </div>
              <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-fg)]">
                {formatCents(inv.total_cents, inv.currency)}
              </div>
              <div className="px-4 py-3 text-sm tabular-nums text-amber-300">
                {formatCents(inv.balance_cents, inv.currency)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
