import type { Invoice, InvoiceStatus } from "./models/invoices";

export interface InvoiceSummary {
  currency: string;
  total_cents: number;
  by_status: Record<InvoiceStatus, number>;
  overdue_count: number;
  overdue_total_cents: number;
}

function initByStatus(): Record<InvoiceStatus, number> {
  return { draft: 0, sent: 0, paid: 0, void: 0, overdue: 0 };
}

export function buildInvoiceSummary(invoices: Invoice[], currency: string): InvoiceSummary {
  const by_status = initByStatus();
  let total_cents = 0;
  let overdue_count = 0;
  let overdue_total_cents = 0;

  for (const inv of invoices) {
    if (inv.currency !== currency) continue;
    if (inv.archived_at != null) continue;

    total_cents += inv.amount_cents;
    by_status[inv.status] += inv.amount_cents;

    if (inv.status === "overdue") {
      overdue_count += 1;
      overdue_total_cents += inv.amount_cents;
    }
  }

  return { currency, total_cents, by_status, overdue_count, overdue_total_cents };
}

