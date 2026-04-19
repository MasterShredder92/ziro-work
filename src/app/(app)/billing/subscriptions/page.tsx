import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { listSubscriptions } from "@/lib/billing/subscriptionEngine";
import { listBillingPlans } from "@data/billingPlans";
import { formatCents, formatDate } from "../components/format";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
    redirect("/dashboard");
  }
}

export default async function BillingSubscriptionsPage() {
  const session = await resolveSession();
  const [subs, plans] = await Promise.all([
    listSubscriptions(session.tenantId, undefined, { limit: 500 }),
    listBillingPlans(session.tenantId, { activeOnly: true, limit: 100 }),
  ]);
  const planById = new Map(plans.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">Subscriptions</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Recurring plans, renewal dates, and student / family assignments.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Plans</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 ? (
            <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]">
              No active plans — create one via the API or billing settings.
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
              >
                <div className="text-[11px] uppercase tracking-wider text-[var(--z-muted)]">
                  {plan.kind} · every {plan.interval_count} {plan.interval}
                </div>
                <div className="mt-1 text-lg font-semibold text-[var(--z-fg)]">
                  {plan.name}
                </div>
                <div className="mt-1 text-sm text-[var(--z-muted)]">
                  {formatCents(plan.base_price_cents, plan.currency)} base
                  {plan.per_unit_price_cents
                    ? ` · +${formatCents(plan.per_unit_price_cents, plan.currency)} / ${plan.unit_label ?? "unit"}`
                    : ""}
                </div>
                {plan.description ? (
                  <div className="mt-2 text-sm text-[var(--z-muted)]">
                    {plan.description}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Active subscriptions</h2>
        <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
          <div
            className="grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]"
            style={{
              gridTemplateColumns: "minmax(160px,1fr) 160px 140px 140px 120px",
            }}
          >
            {["Plan", "Student / Family", "Status", "Next invoice", "Quantity"].map(
              (c) => (
                <div
                  key={c}
                  className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]"
                >
                  {c}
                </div>
              ),
            )}
          </div>
          {subs.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--z-muted)]">
              No subscriptions yet.
            </div>
          ) : (
            subs.map((s) => (
              <div
                key={s.id}
                className="grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02]"
                style={{
                  gridTemplateColumns: "minmax(160px,1fr) 160px 140px 140px 120px",
                }}
              >
                <div className="px-4 py-3 text-sm text-[var(--z-fg)]">
                  {s.billing_plan_id
                    ? (planById.get(s.billing_plan_id)?.name ?? "Plan")
                    : "—"}
                </div>
                <div className="px-4 py-3 text-sm text-[var(--z-muted)]">
                  {s.student_id ? `Student: ${s.student_id.slice(0, 8)}` : null}
                  {s.family_id ? ` Family: ${s.family_id.slice(0, 8)}` : null}
                </div>
                <div className="px-4 py-3 text-sm text-[var(--z-fg)] uppercase">
                  {s.status}
                </div>
                <div className="px-4 py-3 text-sm text-[var(--z-muted)]">
                  {formatDate(s.next_invoice_at)}
                </div>
                <div className="px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]">
                  {s.quantity}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
