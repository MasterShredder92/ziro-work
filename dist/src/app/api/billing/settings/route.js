import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingSettings, upsertBillingSettings } from "@data/billingSettings";
import { httpErrorFromBilling, resolveBillingContext } from "@/lib/billing/guard";
import { readJson } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BillingSettingsPatchSchema = z
    .object({
    invoice_prefix: z.string().min(1).max(12).optional(),
    invoice_next_number: z.number().int().positive().optional(),
    invoice_pad_width: z.number().int().min(1).max(12).optional(),
    default_terms: z.string().nullable().optional(),
    default_net_days: z.number().int().min(0).max(365).optional(),
    default_tax_rate_bp: z.number().int().min(0).max(10000).optional(),
    default_currency: z.string().min(3).max(3).optional(),
    payment_methods: z.array(z.string().min(1)).optional(),
    late_fee_cents: z.number().int().min(0).optional(),
    late_fee_grace_days: z.number().int().min(0).max(90).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})
    .strict();
export async function GET(req) {
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.read");
        const settings = await getBillingSettings(tenantId);
        return NextResponse.json({ data: settings });
    }
    catch (err) {
        const { status, message } = httpErrorFromBilling(err);
        return NextResponse.json({ error: message }, { status });
    }
}
export async function PATCH(req) {
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.write");
        const body = await readJson(req);
        const parsed = BillingSettingsPatchSchema.safeParse(body !== null && body !== void 0 ? body : {});
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid billing settings patch", details: parsed.error.flatten() }, { status: 400 });
        }
        const settings = await upsertBillingSettings(tenantId, parsed.data);
        return NextResponse.json({ data: settings });
    }
    catch (err) {
        const { status, message } = httpErrorFromBilling(err);
        return NextResponse.json({ error: message }, { status });
    }
}
