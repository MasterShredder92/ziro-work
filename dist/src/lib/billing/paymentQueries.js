var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import "server-only";
import { createPayment as dataCreatePayment, getPaymentById, listPayments as dataListPayments, updatePayment, } from "@data/payments";
import { createCredit, listCredits, updateCredit, } from "@data/credits";
import { recomputeInvoiceTotals } from "./invoiceQueries";
export async function listPayments(tenantId, filter, opts) {
    return dataListPayments(tenantId, filter, opts);
}
export async function recordPayment(tenantId, input) {
    var _a, _b, _c;
    const { applyCreditIds } = input, payload = __rest(input, ["applyCreditIds"]);
    const payment = await dataCreatePayment(tenantId, Object.assign({ status: "succeeded", paid_at: new Date().toISOString() }, payload));
    if (applyCreditIds && applyCreditIds.length > 0) {
        const credits = await listCredits(tenantId, undefined, { limit: 200 });
        for (const id of applyCreditIds) {
            const credit = credits.find((c) => c.id === id);
            if (!credit)
                continue;
            const available = Math.max(0, credit.amount_cents - ((_a = credit.applied_cents) !== null && _a !== void 0 ? _a : 0));
            if (available <= 0)
                continue;
            await updateCredit(id, tenantId, {
                applied_cents: ((_b = credit.applied_cents) !== null && _b !== void 0 ? _b : 0) + available,
                invoice_id: (_c = payment.invoice_id) !== null && _c !== void 0 ? _c : credit.invoice_id,
                payment_id: payment.id,
                status: "applied",
            });
        }
    }
    if (payment.invoice_id) {
        await recomputeInvoiceTotals(tenantId, payment.invoice_id);
    }
    return payment;
}
export async function refundPayment(tenantId, id, input) {
    var _a, _b, _c, _d, _e, _f;
    const existing = await getPaymentById(id, tenantId);
    if (!existing)
        throw new Error("Payment not found");
    const amount = Math.min(existing.amount_cents - ((_a = existing.refunded_cents) !== null && _a !== void 0 ? _a : 0), (_b = input === null || input === void 0 ? void 0 : input.amountCents) !== null && _b !== void 0 ? _b : existing.amount_cents);
    const refunded = ((_c = existing.refunded_cents) !== null && _c !== void 0 ? _c : 0) + amount;
    const status = refunded >= existing.amount_cents ? "refunded" : existing.status;
    const updated = await updatePayment(id, tenantId, {
        refunded_cents: refunded,
        refunded_at: new Date().toISOString(),
        refund_reason: (_d = input === null || input === void 0 ? void 0 : input.reason) !== null && _d !== void 0 ? _d : existing.refund_reason,
        status,
    });
    if ((input === null || input === void 0 ? void 0 : input.createCredit) && existing.family_id) {
        await createCredit(tenantId, {
            family_id: existing.family_id,
            student_id: (_e = existing.student_id) !== null && _e !== void 0 ? _e : null,
            amount_cents: amount,
            reason: `Refund credit: ${(_f = input === null || input === void 0 ? void 0 : input.reason) !== null && _f !== void 0 ? _f : "payment refund"}`,
            payment_id: existing.id,
        });
    }
    if (existing.invoice_id) {
        await recomputeInvoiceTotals(tenantId, existing.invoice_id);
    }
    return updated;
}
export async function allocateCredit(tenantId, creditId, invoiceId, amountCents) {
    var _a, _b, _c;
    const credits = await listCredits(tenantId);
    const credit = credits.find((c) => c.id === creditId);
    if (!credit)
        throw new Error("Credit not found");
    const available = Math.max(0, credit.amount_cents - ((_a = credit.applied_cents) !== null && _a !== void 0 ? _a : 0));
    const amount = Math.min(available, Math.max(0, amountCents));
    const updated = await updateCredit(creditId, tenantId, {
        applied_cents: ((_b = credit.applied_cents) !== null && _b !== void 0 ? _b : 0) + amount,
        invoice_id: invoiceId,
        status: ((_c = credit.applied_cents) !== null && _c !== void 0 ? _c : 0) + amount >= credit.amount_cents
            ? "applied"
            : credit.status,
    });
    await recomputeInvoiceTotals(tenantId, invoiceId);
    return updated;
}
