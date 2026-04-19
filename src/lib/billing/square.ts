import {
  listSquareInvoices,
  listSquarePayments,
  listSquareRefunds,
  type SquareInvoiceFilter,
} from "@data/squareInvoices";
import type { ListOptions } from "@data/_client";
import type {
  SquareInvoice,
  SquarePayment,
  SquareRefund,
} from "@/lib/types/entities";

export const square = {
  invoices: {
    list(tenantId: string, filter?: SquareInvoiceFilter, opts?: ListOptions): Promise<SquareInvoice[]> {
      return listSquareInvoices(tenantId, filter, opts);
    },
  },
  payments: {
    list(tenantId: string, opts?: ListOptions): Promise<SquarePayment[]> {
      return listSquarePayments(tenantId, opts);
    },
  },
  refunds: {
    list(tenantId: string, opts?: ListOptions): Promise<SquareRefund[]> {
      return listSquareRefunds(tenantId, opts);
    },
  },
};

export type SquareClient = typeof square;
