var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { NextResponse } from "next/server";
import { z } from "zod";
import { createInvoice, listInvoices, } from "@/lib/billing/invoiceQueries";
import { generateInvoice } from "@/lib/billing/billingOps";
import { httpErrorFromBilling, resolveBillingContext, } from "@/lib/billing/guard";
import { parseListQuery, readJson } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const url = new URL(req.url);
        const tenantHint = url.searchParams.get("tenantId");
        const { tenantId } = await resolveBillingContext(tenantHint, "billing.read");
        const filter = {
            status: (_a = url.searchParams.get("status")) !== null && _a !== void 0 ? _a : undefined,
            family_id: (_b = url.searchParams.get("family_id")) !== null && _b !== void 0 ? _b : undefined,
            student_id: (_c = url.searchParams.get("student_id")) !== null && _c !== void 0 ? _c : undefined,
            subscription_id: (_d = url.searchParams.get("subscription_id")) !== null && _d !== void 0 ? _d : undefined,
            due_before: (_e = url.searchParams.get("due_before")) !== null && _e !== void 0 ? _e : undefined,
            due_after: (_f = url.searchParams.get("due_after")) !== null && _f !== void 0 ? _f : undefined,
            q: (_g = url.searchParams.get("q")) !== null && _g !== void 0 ? _g : undefined,
        };
        const data = await listInvoices(tenantId, filter, parseListQuery(req));
        return NextResponse.json({ data, count: data.length });
    }
    catch (err) {
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
export async function POST(req) {
    var _a, _b, _c, _d;
    try {
        const url = new URL(req.url);
        const { tenantId } = await resolveBillingContext(url.searchParams.get("tenantId"), "billing.write");
        const body = await readJson(req);
        const parsed = CreateInvoiceSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid invoice payload", details: parsed.error.flatten() }, { status: 400 });
        }
        if (parsed.data.mode === "generate") {
            if (!parsed.data.periodStart || !parsed.data.periodEnd) {
                return NextResponse.json({ error: "periodStart and periodEnd are required for generate mode" }, { status: 400 });
            }
            const generated = await generateInvoice({
                tenantId,
                period: {
                    start: parsed.data.periodStart,
                    end: parsed.data.periodEnd,
                },
                subscriptionId: (_a = parsed.data.subscription_id) !== null && _a !== void 0 ? _a : undefined,
                familyId: (_b = parsed.data.family_id) !== null && _b !== void 0 ? _b : null,
                studentId: (_c = parsed.data.student_id) !== null && _c !== void 0 ? _c : null,
            });
            return NextResponse.json({ data: generated }, { status: 201 });
        }
        const _e = parsed.data, { mode: _mode, periodStart: _periodStart, periodEnd: _periodEnd } = _e, invoiceData = __rest(_e, ["mode", "periodStart", "periodEnd"]);
        void _mode;
        void _periodStart;
        void _periodEnd;
        const invoice = await createInvoice(tenantId, Object.assign(Object.assign({}, invoiceData), { lineItems: (_d = invoiceData.lineItems) === null || _d === void 0 ? void 0 : _d.map((item) => (Object.assign(Object.assign({}, item), { invoice_id: "" }))) }));
        return NextResponse.json({ data: invoice }, { status: 201 });
    }
    catch (err) {
        const { status, message } = httpErrorFromBilling(err);
        return NextResponse.json({ error: message }, { status });
    }
}
