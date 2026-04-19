import "server-only";
import {
  createInvoice as dataCreateInvoice,
  deleteInvoice as dataDeleteInvoice,
  getInvoiceById,
  listInvoices as dataListInvoices,
  updateInvoice,
  type InvoiceFilter,
  type InvoiceInsert,
  type InvoiceRow,
  type InvoiceStatus,
  type InvoiceUpdate,
} from "@data/invoices";
import {
  createLineItemsBulk,
  deleteLineItemsForInvoice,
  listLineItems,
  type InvoiceLineItemInsert,
  type InvoiceLineItemRow,
} from "@data/invoiceLineItems";
import {
  getBillingSettings,
  incrementInvoiceSequence,
} from "@data/billingSettings";
import { listPayments, type PaymentRow } from "@data/payments";
import { listCredits, type CreditRow } from "@data/credits";
import type { InvoiceWithLines } from "./models";
import type { ListOptions } from "@data/_client";

const DAY_MS = 1000 * 60 * 60 * 24;

export async function listInvoices(
  tenantId: string,
  filter?: InvoiceFilter,
  opts?: ListOptions,
): Promise<InvoiceRow[]> {
  return dataListInvoices(tenantId, filter, opts);
}

export async function getInvoice(
  tenantId: string,
  id: string,
): Promise<InvoiceWithLines | null> {
  const invoice = await getInvoiceById(id, tenantId);
  if (!invoice) return null;
  const [lineItems, payments, credits] = await Promise.all([
    listLineItems(tenantId, id),
    listPayments(tenantId, { invoice_id: id }),
    listCredits(tenantId, undefined, { limit: 100 }).then((rows) =>
      rows.filter((row) => row.invoice_id === id),
    ),
  ]);
  return { ...invoice, lineItems, payments, credits };
}

function padNumber(n: number, width: number): string {
  const s = `${n}`;
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

async function nextInvoiceNumber(tenantId: string): Promise<string> {
  const settings = await incrementInvoiceSequence(tenantId);
  const prefix = settings.invoice_prefix ?? "INV-";
  const padWidth = settings.invoice_pad_width ?? 4;
  const n = settings.invoice_next_number - 1;
  return `${prefix}${padNumber(n, padWidth)}`;
}

export type CreateInvoiceInput = InvoiceInsert & {
  lineItems?: InvoiceLineItemInsert[];
  autoNumber?: boolean;
};

export async function createInvoice(
  tenantId: string,
  input: CreateInvoiceInput,
): Promise<InvoiceWithLines> {
  const settings = await getBillingSettings(tenantId);
  const defaultNet = settings?.default_net_days ?? 15;
  const taxRateBp = settings?.default_tax_rate_bp ?? 0;

  const lineItems = input.lineItems ?? [];
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = item.quantity ?? 1;
    const unit = item.unit_amount_cents ?? 0;
    const amount = item.amount_cents ?? Math.round(qty * unit);
    return sum + amount;
  }, 0);
  const taxableTotal = lineItems.reduce((sum, item) => {
    if (!item.taxable) return sum;
    const qty = item.quantity ?? 1;
    const unit = item.unit_amount_cents ?? 0;
    const amount = item.amount_cents ?? Math.round(qty * unit);
    return sum + amount;
  }, 0);
  const taxCents = Math.round((taxableTotal * taxRateBp) / 10000);
  const discountCents = input.discount_cents ?? 0;
  const totalCents = Math.max(0, subtotal + taxCents - discountCents);

  const now = new Date();
  const due =
    input.due_at ??
    new Date(now.getTime() + defaultNet * DAY_MS).toISOString();
  const number =
    input.number ??
    (input.autoNumber === false ? null : await nextInvoiceNumber(tenantId));

  const { lineItems: _omit, autoNumber: _auto, ...invoiceInsert } = input;
  void _omit;
  void _auto;

  const invoice = await dataCreateInvoice(tenantId, {
    currency: settings?.default_currency ?? "USD",
    terms: settings?.default_terms ?? null,
    status: "draft",
    issued_at: now.toISOString(),
    due_at: due,
    subtotal_cents: subtotal,
    tax_cents: taxCents,
    discount_cents: discountCents,
    total_cents: totalCents,
    amount_cents: totalCents,
    amount_paid_cents: 0,
    balance_cents: totalCents,
    number,
    ...invoiceInsert,
  });

  const items = lineItems.length
    ? await createLineItemsBulk(
        tenantId,
        lineItems.map((item, idx) => ({
          ...item,
          invoice_id: invoice.id,
          sort_order: item.sort_order ?? idx,
        })),
      )
    : [];

  return { ...invoice, lineItems: items, payments: [], credits: [] };
}

export async function updateInvoiceStatus(
  tenantId: string,
  id: string,
  status: InvoiceStatus | string,
): Promise<InvoiceRow> {
  const patch: InvoiceUpdate = { status };
  if (status === "paid") patch.paid_at = new Date().toISOString();
  if (status === "sent") patch.sent_at = new Date().toISOString();
  return updateInvoice(id, tenantId, patch);
}

export async function voidInvoice(
  tenantId: string,
  id: string,
  reason?: string,
): Promise<InvoiceRow> {
  return updateInvoice(id, tenantId, {
    status: "void",
    voided_at: new Date().toISOString(),
    void_reason: reason ?? null,
  });
}

export async function patchInvoice(
  tenantId: string,
  id: string,
  patch: InvoiceUpdate,
): Promise<InvoiceRow> {
  return updateInvoice(id, tenantId, patch);
}

export async function deleteInvoice(tenantId: string, id: string): Promise<void> {
  await deleteLineItemsForInvoice(id, tenantId);
  await dataDeleteInvoice(id, tenantId);
}

export async function recomputeInvoiceTotals(
  tenantId: string,
  invoiceId: string,
): Promise<InvoiceRow> {
  const [invoice, items, payments] = await Promise.all([
    getInvoiceById(invoiceId, tenantId),
    listLineItems(tenantId, invoiceId),
    listPayments(tenantId, { invoice_id: invoiceId }),
  ]);
  if (!invoice) throw new Error("Invoice not found");
  const subtotal = items.reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const taxable = items
    .filter((i) => i.taxable)
    .reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  const settings = await getBillingSettings(tenantId);
  const taxRateBp = settings?.default_tax_rate_bp ?? 0;
  const tax = Math.round((taxable * taxRateBp) / 10000);
  const discount = invoice.discount_cents ?? 0;
  const total = Math.max(0, subtotal + tax - discount);
  const paid = payments
    .filter((p) => p.status === "succeeded")
    .reduce((s, p) => s + Math.max(0, p.amount_cents - (p.refunded_cents ?? 0)), 0);
  const balance = Math.max(0, total - paid);
  const status: InvoiceStatus =
    invoice.status === "void"
      ? "void"
      : balance === 0
        ? "paid"
        : paid > 0
          ? "partial"
          : (invoice.status as InvoiceStatus) || "open";
  return updateInvoice(invoiceId, tenantId, {
    subtotal_cents: subtotal,
    tax_cents: tax,
    total_cents: total,
    amount_cents: total,
    amount_paid_cents: paid,
    balance_cents: balance,
    status,
    paid_at: balance === 0 ? new Date().toISOString() : null,
  });
}

export type { InvoiceLineItemRow, PaymentRow, CreditRow };
