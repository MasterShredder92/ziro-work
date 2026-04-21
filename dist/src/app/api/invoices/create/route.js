/**
 * /api/invoices/create
 *
 * Simple invoice creation endpoint used by the Invoices page modal.
 * Writes directly to the square_invoices table (internal invoices, not Square-synced).
 * Proxies to the internal billing layer.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const Schema = z.object({
    customer_name: z.string().min(1),
    customer_email: z.string().email().nullable().optional(),
    family_id: z.string().uuid().nullable().optional(),
    amount_cents: z.number().int().positive(),
    due_date: z.string().min(1), // YYYY-MM-DD
    note: z.string().nullable().optional(),
});
export async function POST(req) {
    try {
        const body = await req.json();
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
        }
        const { customer_name, customer_email, family_id, amount_cents, due_date, note } = parsed.data;
        const tenantId = req.headers.get("x-tenant-id") ||
            new URL(req.url).searchParams.get("tenantId") ||
            DEFAULT_TENANT_ID;
        const db = getServiceClient();
        // Insert into square_invoices as an internal invoice
        // square_invoice_id is required — use a prefixed UUID for internal invoices
        const internalId = `internal_${crypto.randomUUID()}`;
        const { data, error } = await db
            .from("square_invoices")
            .insert({
            tenant_id: tenantId,
            family_id: family_id !== null && family_id !== void 0 ? family_id : null,
            customer_name,
            customer_email: customer_email !== null && customer_email !== void 0 ? customer_email : null,
            amount_cents,
            status: "UNPAID",
            due_date,
            title: note !== null && note !== void 0 ? note : null,
            square_invoice_id: internalId,
            invoice_date: new Date().toISOString().split("T")[0],
        })
            .select("id, customer_name, amount_cents, status, due_date")
            .single();
        if (error) {
            console.error("[invoices/create] Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ data }, { status: 201 });
    }
    catch (err) {
        console.error("[invoices/create] Error:", err);
        return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
    }
}
