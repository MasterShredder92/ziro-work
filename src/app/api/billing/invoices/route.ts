import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createInvoice,
  listInvoices,
} from "@/lib/billing/invoiceQueries";
import { generateInvoice } from "@/lib/billing/billingOps";
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
    const tenantHint = url.searchParams.get("tenantId");
    const { tenantId } = await resolveBillingContext(tenantHint, "billing.read");
    const filter = {
      status: url.searchParams.get("status") ?? undefined,
      family_id: url.searchParams.get("family_id") ?? undefined,
      student_id: url.searchParams.get("student_id") ?? undefined,
      subscription_id: url.searchParams.get("subscription_id") ?? undefined,
      due_before: url.searchParams.get("due_before") ?? undefined,
      due_after: url.searchParams.get("due_after") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    };
    const data = await listInvoices(tenantId, filter, parseListQuery(req));
    return NextResponse.json({ data, count: data.length });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit_amount_cents: z.number().int().nonnegative().optional(),
  amount_cents: z.number().int().nonnegative().optional(),
  taxable: z.boolean().optional(),
  kind: z.string().optional(),
  student_id: z.string().uuid().nullable().optional(),
  session_log_id: z.string().uuid().nullable().optional(),
  schedule_block_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const CreateInvoiceSchema = z.object({
  mode: z.literal("generate").optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  family_id: z.string().uuid().nullable().optional(),
  student_id: z.string().uuid().nullable().optional(),
  subscription_id: z.string().uuid().nullable().optional(),
  billing_plan_id: z.string().uuid().nullable().optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
  due_at: z.string().nullable().optional(),
  issued_at: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  discount_cents: z.number().int().nonnegative().optional(),
  number: z.string().nullable().optional(),
  autoNumber: z.boolean().optional(),
  lineItems: z.array(LineItemSchema).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.write",
    );
    const body = await readJson(req);
    const parsed = CreateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid invoice payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (parsed.data.mode === "generate") {
      if (!parsed.data.periodStart || !parsed.data.periodEnd) {
        return NextResponse.json(
          { error: "periodStart and periodEnd are required for generate mode" },
          { status: 400 },
        );
      }
      const generated = await generateInvoice({
        tenantId,
        period: {
          start: parsed.data.periodStart,
          end: parsed.data.periodEnd,
        },
        subscriptionId: parsed.data.subscription_id ?? undefined,
        familyId: parsed.data.family_id ?? null,
        studentId: parsed.data.student_id ?? null,
      });
      return NextResponse.json({ data: generated }, { status: 201 });
    }

    const { mode: _mode, periodStart: _periodStart, periodEnd: _periodEnd, ...invoiceData } = parsed.data;
    void _mode;
    void _periodStart;
    void _periodEnd;
    const invoice = await createInvoice(tenantId, {
      ...invoiceData,
      lineItems: invoiceData.lineItems?.map((item) => ({
        ...item,
        invoice_id: "",
      })),
    });
    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}
