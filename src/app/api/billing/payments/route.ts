import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  listPayments,
  recordPayment,
  refundPayment,
} from "@/lib/billing/paymentQueries";
import {
  httpErrorFromBilling,
  resolveBillingContext,
} from "@/lib/billing/guard";
import { parseListQuery, readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.read",
    );
    const filter = {
      invoice_id: url.searchParams.get("invoice_id") ?? undefined,
      family_id: url.searchParams.get("family_id") ?? undefined,
      student_id: url.searchParams.get("student_id") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      paid_after: url.searchParams.get("paid_after") ?? undefined,
      paid_before: url.searchParams.get("paid_before") ?? undefined,
    };
    const data = await listPayments(tenantId, filter, parseListQuery(req));
    return NextResponse.json({ data, count: data.length });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const CreateSchema = z.object({
  amount_cents: z.number().int().positive(),
  invoice_id: z.string().uuid().nullable().optional(),
  family_id: z.string().uuid().nullable().optional(),
  student_id: z.string().uuid().nullable().optional(),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paid_at: z.string().optional(),
  applyCreditIds: z.array(z.string().uuid()).optional(),
});

const RefundSchema = z.object({
  payment_id: z.string().uuid(),
  amount_cents: z.number().int().positive().optional(),
  reason: z.string().optional(),
  create_credit: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.write",
    );
    const body = (await readJson(req)) as Record<string, unknown> | null;

    if (body && body.mode === "refund") {
      const parsed = RefundSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid refund payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const refunded = await refundPayment(tenantId, parsed.data.payment_id, {
        amountCents: parsed.data.amount_cents,
        reason: parsed.data.reason,
        createCredit: parsed.data.create_credit,
      });
      return NextResponse.json({ data: refunded });
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const payment = await recordPayment(tenantId, parsed.data);
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}
