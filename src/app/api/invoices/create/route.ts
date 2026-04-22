/**
 * /api/invoices/create
 *
 * Full Invoice Builder endpoint.
 * Writes to the invoices table + invoice_items table.
 * Supports: line items, theme preference, location, Google Review toggle, live URL token.
 * Falls back to square_invoices if new columns not yet migrated.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  is_makeup_session: z.boolean().optional().default(false),
  is_fifth_week: z.boolean().optional().default(false),
  session_date: z.string().nullable().optional(),
});

const Schema = z.object({
  customer_name: z.string().min(1),
  customer_email: z.string().email().nullable().optional(),
  family_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  amount_cents: z.number().int().positive(),
  subtotal_cents: z.number().int().positive(),
  total_cents: z.number().int().positive(),
  due_date: z.string().min(1),
  notes: z.string().nullable().optional(),
  theme_preference: z.enum(["dark", "light"]).optional().default("dark"),
  google_review_enabled: z.boolean().optional().default(false),
  live_url_token: z.string().min(8),
  line_items: z.array(LineItemSchema).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      customer_name,
      customer_email,
      family_id,
      location_id,
      amount_cents,
      subtotal_cents,
      total_cents,
      due_date,
      notes,
      theme_preference,
      google_review_enabled,
      live_url_token,
      line_items,
    } = parsed.data;

    const tenantId =
      req.headers.get("x-tenant-id") ||
      new URL(req.url).searchParams.get("tenantId") ||
      DEFAULT_TENANT_ID;

    const db = getServiceClient();

    // ── 1. Try writing to invoices table (new schema) ──────────
    const { data: invoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        tenant_id: tenantId,
        family_id: family_id ?? null,
        location_id: location_id ?? null,
        status: "draft",
        amount_cents,
        subtotal_cents,
        total_cents,
        balance_cents: total_cents,
        due_date,
        issued_at: new Date().toISOString(),
        description: notes ?? null,
        notes: notes ?? null,
        theme_preference,
        google_review_enabled,
        live_url_token,
        metadata: { customer_name, customer_email: customer_email ?? null },
      })
      .select("id, status, total_cents, due_date, live_url_token")
      .single();

    if (invoiceError) {
      // Fallback: write to square_invoices if migration not yet run
      const internalId = `internal_${crypto.randomUUID()}`;
      const { data: fallback, error: fallbackError } = await db
        .from("square_invoices")
        .insert({
          tenant_id: tenantId,
          family_id: family_id ?? null,
          customer_name,
          customer_email: customer_email ?? null,
          amount_cents,
          status: "UNPAID",
          due_date,
          title: notes ?? null,
          square_invoice_id: internalId,
          invoice_date: new Date().toISOString().split("T")[0],
        })
        .select("id, customer_name, amount_cents, status, due_date")
        .single();

      if (fallbackError) {
        console.error("[invoices/create] Both insert paths failed:", invoiceError.message, fallbackError.message);
        return NextResponse.json({ error: invoiceError.message }, { status: 500 });
      }

      return NextResponse.json({ data: fallback, fallback: true }, { status: 201 });
    }

    // ── 2. Insert line items ───────────────────────────────────
    if (invoice && line_items.length > 0) {
      const itemRows = line_items.map((item, idx) => ({
        tenant_id: tenantId,
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        is_makeup_session: item.is_makeup_session,
        is_fifth_week: item.is_fifth_week,
        session_date: item.session_date ?? null,
        sort_order: idx,
      }));

      const { error: itemsError } = await db.from("invoice_items").insert(itemRows);
      if (itemsError) {
        console.warn("[invoices/create] Line items insert failed (non-fatal):", itemsError.message);
      }
    }

    return NextResponse.json({ data: invoice }, { status: 201 });
  } catch (err) {
    console.error("[invoices/create] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
