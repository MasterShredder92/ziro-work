import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recordPayment } from "@/lib/billing/paymentQueries";
import {
  httpErrorFromBilling,
  resolveBillingContext,
} from "@/lib/billing/guard";
import { readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PaySchema = z.object({
  amount_cents: z.number().int().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paid_at: z.string().optional(),
  family_id: z.string().uuid().nullable().optional(),
  student_id: z.string().uuid().nullable().optional(),
  applyCreditIds: z.array(z.string().uuid()).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.write",
    );
    const body = await readJson(req);
    const parsed = PaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const payment = await recordPayment(tenantId, {
      invoice_id: id,
      ...parsed.data,
    });
    return NextResponse.json({ data: payment }, { status: 201 });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}
