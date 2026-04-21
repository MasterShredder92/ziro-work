import { NextResponse } from "next/server";
import { z } from "zod";
import { listPayments, recordPayment, refundPayment, } from "@/lib/billing/paymentQueries";
import { httpErrorFromBilling, resolveBillingContext, } from "@/lib/billing/guard";
import { parseListQuery, readJson } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f;
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.read");
        const filter = {
            invoice_id: (_a = url.searchParams.get("invoice_id")) !== null && _a !== void 0 ? _a : undefined,
            family_id: (_b = url.searchParams.get("family_id")) !== null && _b !== void 0 ? _b : undefined,
            student_id: (_c = url.searchParams.get("student_id")) !== null && _c !== void 0 ? _c : undefined,
            status: (_d = url.searchParams.get("status")) !== null && _d !== void 0 ? _d : undefined,
            paid_after: (_e = url.searchParams.get("paid_after")) !== null && _e !== void 0 ? _e : undefined,
            paid_before: (_f = url.searchParams.get("paid_before")) !== null && _f !== void 0 ? _f : undefined,
        };
        const data = await listPayments(tenantId, filter, parseListQuery(req));
        return NextResponse.json({ data, count: data.length });
    }
    catch (err) {
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
export async function POST(req) {
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.write");
        const body = (await readJson(req));
        if (body && body.mode === "refund") {
            const parsed = RefundSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json({ error: "Invalid refund payload", details: parsed.error.flatten() }, { status: 400 });
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
            return NextResponse.json({ error: "Invalid payment payload", details: parsed.error.flatten() }, { status: 400 });
        }
        const payment = await recordPayment(tenantId, parsed.data);
        return NextResponse.json({ data: payment }, { status: 201 });
    }
    catch (err) {
        const { status, message } = httpErrorFromBilling(err);
        return NextResponse.json({ error: message }, { status });
    }
}
