import "server-only";
import { listInvoices } from "@data/invoices";
import { listPayments } from "@data/payments";
import { listCredits } from "@data/credits";
import type {
  BillingAgingBucket,
  BillingAgingBucketId,
} from "./types";
import type { FamilyBalance } from "./models";

const DAY_MS = 1000 * 60 * 60 * 24;

export async function computeFamilyBalance(
  tenantId: string,
  familyId: string,
): Promise<FamilyBalance> {
  const [invoices, payments, credits] = await Promise.all([
    listInvoices(tenantId, { family_id: familyId }, { limit: 500 }),
    listPayments(tenantId, { family_id: familyId }, { limit: 500 }),
    listCredits(tenantId, { family_id: familyId, status: "active" }, {
      limit: 200,
    }),
  ]);

  const outstandingCents = invoices
    .filter((i) => i.status !== "void" && i.status !== "paid")
    .reduce((s, i) => s + (i.balance_cents ?? 0), 0);
  const paidCents = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + Math.max(0, p.amount_cents - (p.refunded_cents ?? 0)), 0);
  const creditBalanceCents = credits.reduce(
    (s, c) => s + Math.max(0, c.amount_cents - (c.applied_cents ?? 0)),
    0,
  );
  const now = Date.now();
  const overdueInvoices = invoices.filter(
    (i) =>
      i.status !== "void" &&
      i.status !== "paid" &&
      i.due_at &&
      new Date(i.due_at).getTime() < now,
  ).length;
  const openInvoices = invoices.filter(
    (i) => i.status !== "void" && i.status !== "paid",
  ).length;
  return {
    familyId,
    tenantId,
    outstandingCents,
    paidCents,
    creditBalanceCents,
    openInvoices,
    overdueInvoices,
  };
}

type Spec = {
  id: BillingAgingBucketId;
  label: string;
  minDays: number;
  maxDays: number | null;
};

const AGING_SPECS: Spec[] = [
  { id: "current", label: "Current", minDays: -Infinity as number, maxDays: 0 },
  { id: "0-30", label: "1 – 30 days", minDays: 1, maxDays: 30 },
  { id: "31-60", label: "31 – 60 days", minDays: 31, maxDays: 60 },
  { id: "61-90", label: "61 – 90 days", minDays: 61, maxDays: 90 },
  { id: "90+", label: "90+ days", minDays: 91, maxDays: null },
];

export async function computeTenantAging(
  tenantId: string,
): Promise<BillingAgingBucket[]> {
  const invoices = await listInvoices(tenantId, undefined, { limit: 1000 });
  const now = Date.now();
  const buckets = new Map<BillingAgingBucketId, BillingAgingBucket>();
  for (const spec of AGING_SPECS) {
    buckets.set(spec.id, {
      id: spec.id,
      label: spec.label,
      minDays: Number.isFinite(spec.minDays) ? spec.minDays : 0,
      maxDays: spec.maxDays,
      invoiceCount: 0,
      outstandingCents: 0,
    });
  }
  for (const inv of invoices) {
    if (inv.status === "void" || inv.status === "paid") continue;
    const outstanding = inv.balance_cents ?? 0;
    if (outstanding <= 0) continue;
    const due = inv.due_at ? new Date(inv.due_at).getTime() : now;
    const days = Math.floor((now - due) / DAY_MS);
    const spec =
      AGING_SPECS.find(
        (s) => days >= s.minDays && (s.maxDays === null || days <= s.maxDays),
      ) ?? AGING_SPECS[0];
    const bucket = buckets.get(spec.id)!;
    bucket.invoiceCount += 1;
    bucket.outstandingCents += outstanding;
  }
  return AGING_SPECS.map((s) => buckets.get(s.id)!);
}
