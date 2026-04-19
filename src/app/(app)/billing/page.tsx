import { redirect } from "next/navigation";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import {
  getBillingDashboard,
  getBillingOverview,
} from "@/lib/billing/service";
import { listSubscriptions } from "@/lib/billing/subscriptionEngine";
import type { Session } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import {
  AgingReport,
  InvoiceTable,
  PaymentTable,
  PlanSelector,
  SubscriptionOverview,
  UsageBreakdown,
} from "./components";
import { formatCents, formatDate } from "./components/format";
import {
  getUsageBreakdown,
  listPlans,
  listTenantSubscriptions,
} from "@/lib/billing/billingOps";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
    redirect("/dashboard");
  }
}

export default async function BillingPage() {
  const session = await resolveSession();
  await assertTenantAccess(session.tenantId);

  const [data, overview, subscriptions] = await Promise.all([
    getBillingDashboard(session.tenantId),
    getBillingOverview(session.tenantId),
    listSubscriptions(session.tenantId, { status: "active" }, { limit: 50 }),
  ]);
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString();
  const periodEnd = now.toISOString();
  const [plans, osSubscriptions, usage] = await Promise.all([
    listPlans(session.tenantId),
    listTenantSubscriptions(session.tenantId),
    getUsageBreakdown(session.tenantId, { start: periodStart, end: periodEnd }),
  ]);
  const { totals, invoices, payments, aging } = data;
  const upcomingRenewals = subscriptions
    .filter((s) => s.next_invoice_at)
    .sort((a, b) =>
      (a.next_invoice_at ?? "") > (b.next_invoice_at ?? "") ? 1 : -1,
    )
    .slice(0, 5);
  void overview;

  const kpis: Array<{
    label: string;
    value: string;
    tone?: "success" | "warning" | "danger";
  }> = [
    {
      label: "Month-to-date revenue",
      value: formatCents(totals.monthToDateRevenueCents),
      tone: "success",
    },
    {
      label: "Outstanding",
      value: formatCents(totals.totalOutstandingCents),
      tone: totals.totalOutstandingCents > 0 ? "warning" : undefined,
    },
    {
      label: "Overdue",
      value: `${totals.overdueCount} · ${formatCents(totals.overdueAmountCents)}`,
      tone: totals.overdueCount > 0 ? "danger" : undefined,
    },
    {
      label: "Paid (lifetime)",
      value: formatCents(totals.totalPaidCents),
    },
    {
      label: "Average invoice",
      value: formatCents(totals.averageInvoiceCents),
    },
    {
      label: "Collection rate",
      value: `${totals.collectionRatePct}%`,
      tone:
        totals.collectionRatePct >= 90
          ? "success"
          : totals.collectionRatePct >= 70
            ? "warning"
            : "danger",
    },
  ];

  const toneClass: Record<"success" | "warning" | "danger", string> = {
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
  };

  return (
    <>
      <section id="overview" className="scroll-mt-24 space-y-3">
        <header>
          <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
            Billing Overview
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            Unified revenue, invoices, and receivables across your tenant.
          </p>
        </header>
        <Card variant="elevated" padding="md" radius="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                Billing summary
              </div>
              <div className="text-lg font-semibold text-[var(--z-fg)]">
                Revenue & collections
              </div>
            </div>
            <div className="text-xs text-[var(--z-muted)]">
              {totals.invoiceCount} invoices · {totals.paymentCount} payments
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kpis.map((row) => (
              <div
                key={row.label}
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_1.5%)] p-3"
              >
                <div className="text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                  {row.label}
                </div>
                <div
                  className={`mt-1 text-xl font-semibold tabular-nums ${
                    row.tone ? toneClass[row.tone] : "text-[var(--z-fg)]"
                  }`}
                >
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="aging" className="scroll-mt-24">
        <AgingReport buckets={aging} />
      </section>

      <section id="plans" className="scroll-mt-24">
        <PlanSelector plans={plans} activePlanId={osSubscriptions[0]?.planId ?? null} />
      </section>

      <section id="subscriptions" className="scroll-mt-24">
        <SubscriptionOverview subscriptions={osSubscriptions} />
      </section>

      <section id="usage" className="scroll-mt-24">
        <UsageBreakdown
          usage={usage}
          period={{ start: periodStart.slice(0, 10), end: periodEnd.slice(0, 10) }}
        />
      </section>

      <section id="invoices" className="scroll-mt-24 space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-[var(--z-fg)]">Invoices</h2>
          <p className="text-xs text-[var(--z-muted)]">
            Most recent first. Outstanding balances highlighted.
          </p>
        </header>
        <InvoiceTable invoices={invoices} />
      </section>

      <section id="payments" className="scroll-mt-24 space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-[var(--z-fg)]">Payments</h2>
          <p className="text-xs text-[var(--z-muted)]">
            Settlement activity synced from Square.
          </p>
        </header>
        <PaymentTable payments={payments} />
      </section>

      <section id="renewals" className="scroll-mt-24 space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-[var(--z-fg)]">Upcoming renewals</h2>
          <p className="text-xs text-[var(--z-muted)]">
            Next five active subscriptions to be invoiced.
          </p>
        </header>
        <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
          {upcomingRenewals.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--z-muted)]">
              No active subscriptions.
            </div>
          ) : (
            upcomingRenewals.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3 last:border-b-0"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--z-fg)]">
                    Subscription {s.id.slice(0, 8)}
                  </div>
                  <div className="text-[11px] text-[var(--z-muted)]">
                    {s.billing_plan_id ? `Plan ${s.billing_plan_id.slice(0, 8)}` : "No plan"}
                    {s.price_override_cents
                      ? ` · ${formatCents(s.price_override_cents)}`
                      : ""}
                  </div>
                </div>
                <div className="text-sm text-[var(--z-muted)]">
                  {formatDate(s.next_invoice_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="text-[11px] text-[var(--z-muted)] pt-2">
        Generated at {new Date(data.generatedAt).toLocaleString()}
      </div>
    </>
  );
}
