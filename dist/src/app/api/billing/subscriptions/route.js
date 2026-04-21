import { NextResponse } from "next/server";
import { z } from "zod";
import { createSubscription, generateRecurringInvoices, listSubscriptions, } from "@/lib/billing/subscriptionEngine";
import { createSubscription as createBillingOsSubscription, } from "@/lib/billing/billingOps";
import { httpErrorFromBilling, resolveBillingContext, } from "@/lib/billing/guard";
import { parseListQuery, readJson } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e;
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.read");
        const filter = {
            family_id: (_a = url.searchParams.get("family_id")) !== null && _a !== void 0 ? _a : undefined,
            student_id: (_b = url.searchParams.get("student_id")) !== null && _b !== void 0 ? _b : undefined,
            billing_plan_id: (_c = url.searchParams.get("billing_plan_id")) !== null && _c !== void 0 ? _c : undefined,
            status: (_d = url.searchParams.get("status")) !== null && _d !== void 0 ? _d : undefined,
            due_before: (_e = url.searchParams.get("due_before")) !== null && _e !== void 0 ? _e : undefined,
        };
        const data = await listSubscriptions(tenantId, filter, parseListQuery(req));
        return NextResponse.json({ data, count: data.length });
    }
    catch (err) {
        const { status, message } = httpErrorFromBilling(err);
        return NextResponse.json({ error: message }, { status });
    }
}
const CreateSchema = z.object({
    planId: z.string().uuid().optional(),
    billingCycle: z.enum(["monthly", "yearly"]).optional(),
    billing_plan_id: z.string().uuid().nullable().optional(),
    family_id: z.string().uuid().nullable().optional(),
    student_id: z.string().uuid().nullable().optional(),
    status: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().nullable().optional(),
    price_override_cents: z.number().int().nonnegative().nullable().optional(),
    quantity: z.number().positive().optional(),
    notes: z.string().nullable().optional(),
});
const GenerateSchema = z.object({ mode: z.literal("generate"), limit: z.number().int().positive().optional() });
export async function POST(req) {
    var _a, _b;
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.write");
        const body = (await readJson(req));
        if (body && body.mode === "generate") {
            const parsed = GenerateSchema.safeParse(body);
            if (!parsed.success) {
                return NextResponse.json({ error: "Invalid generate payload", details: parsed.error.flatten() }, { status: 400 });
            }
            const results = await generateRecurringInvoices(tenantId, {
                limit: parsed.data.limit,
            });
            return NextResponse.json({ data: results, count: results.length });
        }
        const parsed = CreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid subscription payload", details: parsed.error.flatten() }, { status: 400 });
        }
        if (parsed.data.planId) {
            const sub = await createBillingOsSubscription({
                tenantId,
                planId: parsed.data.planId,
                billingCycle: parsed.data.billingCycle,
                familyId: (_a = parsed.data.family_id) !== null && _a !== void 0 ? _a : null,
                studentId: (_b = parsed.data.student_id) !== null && _b !== void 0 ? _b : null,
            });
            return NextResponse.json({ data: sub }, { status: 201 });
        }
        const sub = await createSubscription(tenantId, parsed.data);
        return NextResponse.json({ data: sub }, { status: 201 });
    }
    catch (err) {
        const { status, message } = httpErrorFromBilling(err);
        return NextResponse.json({ error: message }, { status });
    }
}
