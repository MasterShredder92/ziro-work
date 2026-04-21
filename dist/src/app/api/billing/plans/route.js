import { NextResponse } from "next/server";
import { httpErrorFromBilling, resolveBillingContext } from "@/lib/billing/guard";
import { listPlans } from "@/lib/billing/billingOps";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.read");
        const data = await listPlans(tenantId);
        return NextResponse.json({ data, count: data.length });
    }
    catch (err) {
        const { status, message } = httpErrorFromBilling(err);
        return NextResponse.json({ error: message }, { status });
    }
}
