import type { SquareInvoice, SquarePayment } from "@/lib/types/entities";

export type BillingInvoiceRow = SquareInvoice & {
  outstanding_cents: number;
  is_overdue: boolean;
  days_overdue: number;
};

export type BillingPaymentRow = SquarePayment & {
  net_cents: number;
};

export type BillingAgingBucketId =
  | "current"
  | "0-30"
  | "31-60"
  | "61-90"
  | "90+";

export type BillingAgingBucket = {
  id: BillingAgingBucketId;
  label: string;
  minDays: number;
  maxDays: number | null;
  invoiceCount: number;
  outstandingCents: number;
};

export type BillingDashboardTotals = {
  invoiceCount: number;
  paymentCount: number;
  totalInvoicedCents: number;
  totalOutstandingCents: number;
  totalPaidCents: number;
  overdueCount: number;
  overdueAmountCents: number;
  monthToDateRevenueCents: number;
  averageInvoiceCents: number;
  collectionRatePct: number;
};

export type BillingDashboardData = {
  tenantId: string;
  invoices: BillingInvoiceRow[];
  payments: BillingPaymentRow[];
  aging: BillingAgingBucket[];
  totals: BillingDashboardTotals;
  generatedAt: string;
};

export type BillingPeriod = {
  start: string;
  end: string;
};

export type Plan = {
  id: string;
  tenantId: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  limits: Record<string, unknown>;
  active: boolean;
  billingPlanId?: string | null;
};

export type Subscription = {
  id: string;
  tenantId: string;
  planId: string | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UsageRecord = {
  id: string;
  tenantId: string;
  metric: string;
  amount: number;
  timestamp: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type Invoice = {
  id: string;
  tenantId: string;
  amount: number;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  lineItems: Array<Record<string, unknown>>;
  stripeInvoiceId?: string | null;
};

export type PaymentMethod =
  | "card"
  | "ach"
  | "manual"
  | "cash"
  | "check"
  | "stripe";
