import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { httpErrorFromBilling, resolveBillingContext } from "@/lib/billing/guard";
import { getUsageBreakdown, recordUsage } from "@/lib/billing/billingOps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RecordUsageSchema = z.object({
  metric: z.string().min(1),
  amount: z.number(),
  source: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.read",
    );
    const from =
      url.searchParams.get("from") ??
      new Date(new Date().setUTCDate(1)).toISOString();
    const to = url.searchParams.get("to") ?? new Date().toISOString();
    const data = await getUsageBreakdown(tenantId, { start: from, end: to });
    return NextResponse.json({ data, count: data.length });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.write",
    );
    const body = await req.json();
    const parsed = RecordUsageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid usage payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = await recordUsage({ tenantId, ...parsed.data });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}
