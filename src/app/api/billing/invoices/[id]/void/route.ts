import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { voidInvoice } from "@/lib/billing/invoiceQueries";
import {
  httpErrorFromBilling,
  resolveBillingContext,
} from "@/lib/billing/guard";
import { readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({ reason: z.string().optional() });

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
    const parsed = Schema.safeParse(body ?? {});
    const reason = parsed.success ? parsed.data.reason : undefined;
    const invoice = await voidInvoice(tenantId, id, reason);
    return NextResponse.json({ data: invoice });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}
