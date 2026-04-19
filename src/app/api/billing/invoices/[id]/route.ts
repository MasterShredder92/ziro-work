import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteInvoice,
  getInvoice,
  patchInvoice,
} from "@/lib/billing/invoiceQueries";
import {
  httpErrorFromBilling,
  resolveBillingContext,
} from "@/lib/billing/guard";
import { readJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.read",
    );
    const invoice = await getInvoice(tenantId, id);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: invoice });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const PatchSchema = z
  .object({
    status: z.string().optional(),
    due_at: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    terms: z.string().nullable().optional(),
    discount_cents: z.number().int().nonnegative().optional(),
    number: z.string().nullable().optional(),
  })
  .passthrough();

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.write",
    );
    const body = await readJson(req);
    const parsed = PatchSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid patch payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const invoice = await patchInvoice(tenantId, id, parsed.data);
    return NextResponse.json({ data: invoice });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const { tenantId } = await resolveBillingContext(
      url.searchParams.get("tenantId"),
      "billing.write",
    );
    await deleteInvoice(tenantId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}
