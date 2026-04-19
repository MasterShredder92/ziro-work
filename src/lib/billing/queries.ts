import { listSquareInvoices, listSquarePayments } from "@data/squareInvoices";
import type {
  SquareInvoice,
  SquarePayment,
} from "@/lib/types/entities";
import type {
  BillingAgingBucket,
  BillingAgingBucketId,
  BillingInvoiceRow,
  BillingPaymentRow,
} from "./types";

const DAY_MS = 1000 * 60 * 60 * 24;

function diffDays(fromIso: string | null | undefined, to: Date): number {
  if (!fromIso) return 0;
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return 0;
  return Math.floor((to.getTime() - from) / DAY_MS);
}

function outstandingCents(invoice: SquareInvoice): number {
  const amount = invoice.amount_cents ?? 0;
  const paid = invoice.amount_paid ?? 0;
  return Math.max(0, amount - paid);
}

function toInvoiceRow(invoice: SquareInvoice, now: Date): BillingInvoiceRow {
  const outstanding = outstandingCents(invoice);
  const daysOverdue =
    outstanding > 0 && invoice.due_date ? diffDays(invoice.due_date, now) : 0;
  return {
    ...invoice,
    outstanding_cents: outstanding,
    is_overdue: outstanding > 0 && daysOverdue > 0,
    days_overdue: Math.max(0, daysOverdue),
  };
}

function toPaymentRow(payment: SquarePayment): BillingPaymentRow {
  const net =
    payment.net_total_cents ??
    payment.total_money_cents ??
    payment.amount_money_cents ??
    0;
  return {
    ...payment,
    net_cents: net,
  };
}

export async function getTenantInvoices(
  tenantId: string,
): Promise<BillingInvoiceRow[]> {
  const invoices = await listSquareInvoices(tenantId, undefined, {
    limit: 500,
    orderBy: "invoice_date",
    ascending: false,
  });
  const now = new Date();
  return invoices.map((invoice) => toInvoiceRow(invoice, now));
}

export async function getTenantPayments(
  tenantId: string,
): Promise<BillingPaymentRow[]> {
  const payments = await listSquarePayments(tenantId, {
    limit: 500,
    orderBy: "reporting_date",
    ascending: false,
  });
  return payments.map(toPaymentRow);
}

type BucketSpec = {
  id: BillingAgingBucketId;
  label: string;
  minDays: number;
  maxDays: number | null;
};

const BUCKET_SPECS: BucketSpec[] = [
  { id: "current", label: "Current", minDays: -Infinity as number, maxDays: 0 },
  { id: "0-30", label: "1 – 30 days", minDays: 1, maxDays: 30 },
  { id: "31-60", label: "31 – 60 days", minDays: 31, maxDays: 60 },
  { id: "61-90", label: "61 – 90 days", minDays: 61, maxDays: 90 },
  { id: "90+", label: "90+ days", minDays: 91, maxDays: null },
];

function bucketFor(daysOverdue: number): BucketSpec {
  for (const spec of BUCKET_SPECS) {
    const min = spec.minDays;
    const max = spec.maxDays;
    if (daysOverdue >= min && (max === null || daysOverdue <= max)) {
      return spec;
    }
  }
  return BUCKET_SPECS[0];
}

export function buildAgingReport(
  invoices: BillingInvoiceRow[],
): BillingAgingBucket[] {
  const buckets = new Map<BillingAgingBucketId, BillingAgingBucket>();
  for (const spec of BUCKET_SPECS) {
    buckets.set(spec.id, {
      id: spec.id,
      label: spec.label,
      minDays: Number.isFinite(spec.minDays) ? spec.minDays : 0,
      maxDays: spec.maxDays,
      invoiceCount: 0,
      outstandingCents: 0,
    });
  }

  for (const invoice of invoices) {
    if (invoice.outstanding_cents <= 0) continue;
    const spec = bucketFor(invoice.days_overdue);
    const bucket = buckets.get(spec.id);
    if (!bucket) continue;
    bucket.invoiceCount += 1;
    bucket.outstandingCents += invoice.outstanding_cents;
  }

  return BUCKET_SPECS.map((spec) => buckets.get(spec.id) as BillingAgingBucket);
}

export async function getAgingReport(
  tenantId: string,
): Promise<BillingAgingBucket[]> {
  const invoices = await getTenantInvoices(tenantId);
  return buildAgingReport(invoices);
}
