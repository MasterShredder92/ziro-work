/**
 * Billing & Invoicing OS — domain models.
 *
 * These are thin re-exports / aliases of the @data row types so UI, API, and
 * service code can import from a single stable module.
 */

export type {
  InvoiceRow as Invoice,
  InvoiceInsert,
  InvoiceUpdate,
  InvoiceFilter,
  InvoiceStatus,
} from "@data/invoices";

export type {
  InvoiceLineItemRow as InvoiceLineItem,
  InvoiceLineItemInsert,
  InvoiceLineItemUpdate,
} from "@data/invoiceLineItems";

export type {
  PaymentRow as Payment,
  PaymentInsert,
  PaymentUpdate,
  PaymentFilter,
} from "@data/payments";

export type {
  CreditRow as Credit,
  CreditInsert,
  CreditUpdate,
  CreditFilter,
} from "@data/credits";

export type {
  DiscountRow as Discount,
  DiscountInsert,
  DiscountUpdate,
} from "@data/discounts";

export type {
  BillingPlanRow as BillingPlan,
  BillingPlanInsert,
  BillingPlanUpdate,
  BillingPlanKind,
  BillingPlanInterval,
} from "@data/billingPlans";

export type {
  SubscriptionRow as Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
  SubscriptionFilter,
  SubscriptionStatus,
} from "@data/subscriptions";

export type {
  BillingSettingsRow as BillingSettings,
  BillingSettingsUpdate,
} from "@data/billingSettings";

export type InvoiceWithLines = import("@data/invoices").InvoiceRow & {
  lineItems: import("@data/invoiceLineItems").InvoiceLineItemRow[];
  payments: import("@data/payments").PaymentRow[];
  credits: import("@data/credits").CreditRow[];
};

export type FamilyBalance = {
  familyId: string;
  tenantId: string;
  outstandingCents: number;
  paidCents: number;
  creditBalanceCents: number;
  openInvoices: number;
  overdueInvoices: number;
};
