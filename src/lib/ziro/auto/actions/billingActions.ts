import type { SquareInvoice } from "@/lib/types/entities";
import { listSquareInvoices } from "@data/squareInvoices";
import type {
  AutoActionDefinition,
  AutoActionPack,
  AutoActionResult,
} from "../types";

const REMINDER_GRACE_DAYS = 1;
const LATE_FEE_THRESHOLD_DAYS = 14;
const LATE_FEE_RATE = 0.05;

function isOverdue(invoice: SquareInvoice, now: Date): boolean {
  const status = (invoice.status ?? "").toUpperCase();
  if (status === "PAID" || status === "CANCELED" || status === "CANCELLED") {
    return false;
  }
  if (!invoice.due_date) return false;
  const due = new Date(invoice.due_date).getTime();
  if (!Number.isFinite(due)) return false;
  return due < now.getTime();
}

function daysBetween(olderIso: string | null, now: Date): number | null {
  if (!olderIso) return null;
  const t = new Date(olderIso).getTime();
  if (!Number.isFinite(t)) return null;
  const diff = now.getTime() - t;
  if (diff < 0) return 0;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function invoiceDisplayName(invoice: SquareInvoice): string {
  if (invoice.title && invoice.title.trim().length > 0) return invoice.title.trim();
  if (invoice.invoice_number && invoice.invoice_number.trim().length > 0) {
    return invoice.invoice_number.trim();
  }
  return invoice.square_invoice_id;
}

async function loadOverdueInvoices(
  tenantId: string,
  now: Date,
): Promise<SquareInvoice[]> {
  const invoices = await listSquareInvoices(
    tenantId,
    {},
    { limit: 500, ascending: false },
  );
  return (invoices as SquareInvoice[]).filter((invoice) => isOverdue(invoice, now));
}

export const detectOverdueInvoices: AutoActionDefinition = {
  key: "detectOverdueInvoices",
  description: "Flag unpaid invoices past their due date.",
  async handler(ctx): Promise<AutoActionResult> {
    const overdue = await loadOverdueInvoices(ctx.tenantId, ctx.now);
    const entries = overdue.map((invoice) => ({
      invoiceId: invoice.id,
      squareInvoiceId: invoice.square_invoice_id,
      title: invoiceDisplayName(invoice),
      status: invoice.status,
      amountCents: invoice.amount_cents ?? null,
      amountPaid: invoice.amount_paid ?? null,
      dueDate: invoice.due_date,
      customerName: invoice.customer_name ?? null,
      customerEmail: invoice.customer_email ?? null,
      daysOverdue: daysBetween(invoice.due_date, ctx.now),
    }));
    return {
      triggered: entries.length > 0,
      details: {
        count: entries.length,
        invoices: entries,
      },
    };
  },
};

export const autoSendInvoiceReminders: AutoActionDefinition = {
  key: "autoSendInvoiceReminders",
  description: "Assemble reminder payloads for overdue invoices.",
  async handler(ctx): Promise<AutoActionResult> {
    const overdue = await loadOverdueInvoices(ctx.tenantId, ctx.now);
    const reminders = overdue
      .filter((invoice) => {
        const days = daysBetween(invoice.due_date, ctx.now);
        return typeof days === "number" && days >= REMINDER_GRACE_DAYS;
      })
      .map((invoice) => ({
        invoiceId: invoice.id,
        squareInvoiceId: invoice.square_invoice_id,
        title: invoiceDisplayName(invoice),
        customerName: invoice.customer_name ?? null,
        customerEmail: invoice.customer_email ?? null,
        amountCents: invoice.amount_cents ?? null,
        dueDate: invoice.due_date,
        daysOverdue: daysBetween(invoice.due_date, ctx.now),
        channel: invoice.customer_email ? "email" : "manual",
      }));
    return {
      triggered: reminders.length > 0,
      details: {
        mode: "metadata",
        count: reminders.length,
        reminders,
      },
    };
  },
};

export const autoApplyLateFees: AutoActionDefinition = {
  key: "autoApplyLateFees",
  description: "Compute late fee recommendations without writing to the database.",
  async handler(ctx): Promise<AutoActionResult> {
    const overdue = await loadOverdueInvoices(ctx.tenantId, ctx.now);
    const fees = overdue
      .map((invoice) => {
        const days = daysBetween(invoice.due_date, ctx.now);
        if (typeof days !== "number" || days < LATE_FEE_THRESHOLD_DAYS) {
          return null;
        }
        const amountCents = invoice.amount_cents ?? 0;
        const feeCents = Math.round(amountCents * LATE_FEE_RATE);
        return {
          invoiceId: invoice.id,
          squareInvoiceId: invoice.square_invoice_id,
          title: invoiceDisplayName(invoice),
          amountCents,
          proposedFeeCents: feeCents,
          daysOverdue: days,
          rate: LATE_FEE_RATE,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

    return {
      triggered: fees.length > 0,
      details: {
        mode: "metadata",
        threshold: LATE_FEE_THRESHOLD_DAYS,
        rate: LATE_FEE_RATE,
        count: fees.length,
        fees,
      },
    };
  },
};

export const billingAutoActions: AutoActionPack = {
  key: "billing",
  description: "Billing and invoice automations.",
  actions: [detectOverdueInvoices, autoSendInvoiceReminders, autoApplyLateFees],
};
