import "server-only";
import {
  createPayment as dataCreatePayment,
  getPaymentById,
  listPayments as dataListPayments,
  updatePayment,
  type PaymentFilter,
  type PaymentInsert,
  type PaymentRow,
} from "@data/payments";
import {
  createCredit,
  listCredits,
  updateCredit,
  type CreditRow,
} from "@data/credits";
import { recomputeInvoiceTotals } from "./invoiceQueries";
import type { ListOptions } from "@data/_client";

export async function listPayments(
  tenantId: string,
  filter?: PaymentFilter,
  opts?: ListOptions,
): Promise<PaymentRow[]> {
  return dataListPayments(tenantId, filter, opts);
}

export type RecordPaymentInput = PaymentInsert & {
  applyCreditIds?: string[];
};

export async function recordPayment(
  tenantId: string,
  input: RecordPaymentInput,
): Promise<PaymentRow> {
  const { applyCreditIds, ...payload } = input;
  const payment = await dataCreatePayment(tenantId, {
    status: "succeeded",
    paid_at: new Date().toISOString(),
    ...payload,
  });

  if (applyCreditIds && applyCreditIds.length > 0) {
    const credits = await listCredits(tenantId, undefined, { limit: 200 });
    for (const id of applyCreditIds) {
      const credit = credits.find((c) => c.id === id);
      if (!credit) continue;
      const available = Math.max(
        0,
        credit.amount_cents - (credit.applied_cents ?? 0),
      );
      if (available <= 0) continue;
      await updateCredit(id, tenantId, {
        applied_cents: (credit.applied_cents ?? 0) + available,
        invoice_id: payment.invoice_id ?? credit.invoice_id,
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

export async function refundPayment(
  tenantId: string,
  id: string,
  input?: { amountCents?: number; reason?: string; createCredit?: boolean },
): Promise<PaymentRow> {
  const existing = await getPaymentById(id, tenantId);
  if (!existing) throw new Error("Payment not found");
  const amount = Math.min(
    existing.amount_cents - (existing.refunded_cents ?? 0),
    input?.amountCents ?? existing.amount_cents,
  );
  const refunded = (existing.refunded_cents ?? 0) + amount;
  const status =
    refunded >= existing.amount_cents ? "refunded" : existing.status;
  const updated = await updatePayment(id, tenantId, {
    refunded_cents: refunded,
    refunded_at: new Date().toISOString(),
    refund_reason: input?.reason ?? existing.refund_reason,
    status,
  });
  if (input?.createCredit && existing.family_id) {
    await createCredit(tenantId, {
      family_id: existing.family_id,
      student_id: existing.student_id ?? null,
      amount_cents: amount,
      reason: `Refund credit: ${input?.reason ?? "payment refund"}`,
      payment_id: existing.id,
    });
  }
  if (existing.invoice_id) {
    await recomputeInvoiceTotals(tenantId, existing.invoice_id);
  }
  return updated;
}

export async function allocateCredit(
  tenantId: string,
  creditId: string,
  invoiceId: string,
  amountCents: number,
): Promise<CreditRow> {
  const credits = await listCredits(tenantId);
  const credit = credits.find((c) => c.id === creditId);
  if (!credit) throw new Error("Credit not found");
  const available = Math.max(
    0,
    credit.amount_cents - (credit.applied_cents ?? 0),
  );
  const amount = Math.min(available, Math.max(0, amountCents));
  const updated = await updateCredit(creditId, tenantId, {
    applied_cents: (credit.applied_cents ?? 0) + amount,
    invoice_id: invoiceId,
    status:
      (credit.applied_cents ?? 0) + amount >= credit.amount_cents
        ? "applied"
        : credit.status,
  });
  await recomputeInvoiceTotals(tenantId, invoiceId);
  return updated;
}
