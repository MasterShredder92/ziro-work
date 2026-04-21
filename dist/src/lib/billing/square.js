import { listSquareInvoices, listSquarePayments, listSquareRefunds, } from "@data/squareInvoices";
export const square = {
    invoices: {
        list(tenantId, filter, opts) {
            return listSquareInvoices(tenantId, filter, opts);
        },
    },
    payments: {
        list(tenantId, opts) {
            return listSquarePayments(tenantId, opts);
        },
    },
    refunds: {
        list(tenantId, opts) {
            return listSquareRefunds(tenantId, opts);
        },
    },
};
