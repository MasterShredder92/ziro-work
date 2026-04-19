import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  cancelSubscription,
  getSubscription,
  updateSubscription,
} from "@/lib/billing/subscriptionEngine";
import { updateSubscription as updateBillingOsSubscription } from "@/lib/billing/billingOps";
import { deleteSubscription } from "@data/subscriptions";
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
    const sub = await getSubscription(tenantId, id);
    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: sub });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const PatchSchema = z
  .object({
    planId: z.string().uuid().nullable().optional(),
    status: z.string().optional(),
    end_date: z.string().nullable().optional(),
    price_override_cents: z.number().int().nullable().optional(),
    quantity: z.number().positive().optional(),
    notes: z.string().nullable().optional(),
    next_invoice_at: z.string().nullable().optional(),
    cancel_reason: z.string().nullable().optional(),
    cancel: z.boolean().optional(),
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
    if (parsed.data.cancel === true) {
      const cancelled = await cancelSubscription(
        tenantId,
        id,
        parsed.data.cancel_reason ?? undefined,
      );
      return NextResponse.json({ data: cancelled });
    }
    if (parsed.data.planId !== undefined || parsed.data.status !== undefined) {
      const sub = await updateBillingOsSubscription({
        tenantId,
        subscriptionId: id,
        status: parsed.data.status,
        planId: parsed.data.planId,
      });
      return NextResponse.json({ data: sub });
    }
    const sub = await updateSubscription(tenantId, id, parsed.data);
    return NextResponse.json({ data: sub });
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
    await deleteSubscription(id, tenantId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const { status, message } = httpErrorFromBilling(err);
    return NextResponse.json({ error: message }, { status });
  }
}
