/**
 * /api/invoice/[token]
 *
 * Public endpoint — fetches invoice data by live_url_token.
 * No auth required (token is the secret).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const db = getServiceClient();

  // Try invoices table first (new schema)
  const { data: invoice, error } = await db
    .from("invoices")
    .select(`
      id,
      tenant_id,
      family_id,
      student_id,
      location_id,
      status,
      total_cents,
      subtotal_cents,
      discount_cents,
      due_date,
      issued_at,
      paid_at,
      description,
      notes,
      theme_preference,
      google_review_enabled,
      live_url_token,
      metadata
    `)
    .eq("live_url_token", token)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Fetch line items
  const { data: lineItems } = await db
    .from("invoice_items")
    .select("id, description, quantity, unit_price, is_makeup_session, is_fifth_week, session_date, sort_order")
    .eq("invoice_id", invoice.id)
    .order("sort_order");

  // Fetch tenant branding
  const { data: tenant } = await db
    .from("tenants")
    .select("name, logo_url, primary_color, accent_color")
    .eq("id", invoice.tenant_id)
    .single();

  // Fetch location info
  let location = null;
  if (invoice.location_id) {
    const { data: loc } = await db
      .from("locations")
      .select("id, name, address, phone")
      .eq("id", invoice.location_id)
      .single();
    location = loc;
  }

  return NextResponse.json({
    invoice,
    line_items: lineItems ?? [],
    tenant: tenant ?? null,
    location,
  });
}

// Mark invoice as viewed
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const db = getServiceClient();

  await db
    .from("invoices")
    .update({ metadata: { viewed_at: new Date().toISOString() } })
    .eq("live_url_token", token);

  return NextResponse.json({ ok: true });
}
