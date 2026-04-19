import type { Subscription } from "@/lib/billing/types";

type Props = {
  subscriptions: Subscription[];
};

export function SubscriptionOverview({ subscriptions }: Props) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold text-[var(--z-fg)]">Subscriptions</h2>
        <p className="text-xs text-[var(--z-muted)]">
          Current status and billing periods synced with Stripe.
        </p>
      </header>
      <div className="overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]">
        <div className="grid grid-cols-[1.1fr_120px_160px_160px] border-b border-[var(--z-border)] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          <div>Subscription</div>
          <div>Status</div>
          <div>Period start</div>
          <div>Period end</div>
        </div>
        {subscriptions.length === 0 ? (
          <div className="px-4 py-6 text-sm text-[var(--z-muted)]">
            No subscriptions yet.
          </div>
        ) : (
          subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="grid grid-cols-[1.1fr_120px_160px_160px] border-b border-[var(--z-border)] px-4 py-3 text-sm last:border-b-0"
            >
              <div className="text-[var(--z-fg)]">{subscription.id.slice(0, 8)}</div>
              <div className="text-[var(--z-muted)]">{subscription.status}</div>
              <div className="text-[var(--z-muted)]">
                {subscription.currentPeriodStart ?? "—"}
              </div>
              <div className="text-[var(--z-muted)]">
                {subscription.currentPeriodEnd ?? "—"}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
