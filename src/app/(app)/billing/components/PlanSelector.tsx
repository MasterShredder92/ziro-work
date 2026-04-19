import type { Plan } from "@/lib/billing/types";
import { formatCents } from "./format";

type Props = {
  plans: Plan[];
  activePlanId?: string | null;
};

export function PlanSelector({ plans, activePlanId }: Props) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Plans</h2>
        <p className="text-xs text-[var(--z-muted)]">
          Monthly and yearly pricing for tenant billing plans.
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {plans.length === 0 ? (
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-5 text-sm text-[var(--z-muted)]">
            No plans configured.
          </div>
        ) : (
          plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--z-fg)]">{plan.name}</h3>
                  <p className="mt-1 text-xs text-[var(--z-muted)]">
                    Monthly {formatCents(plan.priceMonthly)} · Yearly{" "}
                    {formatCents(plan.priceYearly)}
                  </p>
                </div>
                {activePlanId === plan.id ? (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Active
                  </span>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
