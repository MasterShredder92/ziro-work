/**
 * POST /api/invoices/:id/pdf  → generate PDF, upload to storage, save pdf_url
 * GET  /api/invoices/:id/pdf  → returns { pdf_url }, generates if missing
 *
 * Storage bucket: invoice-pdfs (public)
 * File path: {tenant_id}/{invoice_id}.pdf
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import { renderInvoicePdf, type InvoicePdfInput } from "@/lib/invoice/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "invoice-pdfs";

async function generateAndUpload(invoiceId: string): Promise<string> {
  assertServiceRoleAllowed("PDF generation + storage upload — service-role required for storage admin operations");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getServiceClient() as any;

  const { data: inv, error: invErr } = await db
    .from("invoices")
    .select(
      "id, tenant_id, family_id, location_id, number, issued_at, due_date, total_cents, subtotal_cents, balance_cents, notes, google_review_enabled, is_recurring, metadata, status"
    )
    .eq("id", invoiceId)
    .maybeSingle();
  if (invErr || !inv) {
    throw new Error(invErr?.message || "Invoice not found");
  }

  const meta = (inv.metadata ?? {}) as { customer_name?: string; customer_email?: string };

  // Tenant
  const { data: tenant } = await db
    .from("tenants")
    .select("name, logo_url, primary_color, accent_color")
    .eq("id", inv.tenant_id)
    .maybeSingle();

  // Location
  let location: InvoicePdfInput["location"] = null;
  if (inv.location_id) {
    const { data: loc } = await db
      .from("locations")
      .select("name, address_line1, city, state, postal_code, phone, email, google_review_url")
      .eq("id", inv.location_id)
      .maybeSingle();
    location = (loc as InvoicePdfInput["location"]) ?? null;
  }

  // Family fallback name
  let customerName = meta.customer_name ?? "";
  let customerEmail = meta.customer_email ?? null;
  if (!customerName && inv.family_id) {
    const { data: fam } = await db
      .from("families")
      .select("name, primary_email")
      .eq("id", inv.family_id)
      .maybeSingle();
    customerName = fam?.name ?? "Customer";
    customerEmail = customerEmail ?? fam?.primary_email ?? null;
  }

  // Line items
  const { data: items } = await db
    .from("invoice_items")
    .select("description, quantity, unit_price")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  const pdfInput: InvoicePdfInput = {
    invoice: {
      id: inv.id,
      number: inv.number ?? null,
      issued_at: inv.issued_at,
      due_date: inv.due_date,
      total_cents: Number(inv.total_cents) || 0,
      subtotal_cents: Number(inv.subtotal_cents) || 0,
      balance_cents: Number(inv.balance_cents ?? inv.total_cents) || 0,
      notes: inv.notes ?? null,
      google_review_enabled: !!inv.google_review_enabled,
      is_recurring: !!inv.is_recurring,
      status: (inv.status ?? "OPEN").toString().toUpperCase(),
    },
    customer: { name: customerName || "Customer", email: customerEmail },
    tenant: {
      name: tenant?.name ?? "ZiroWork",
      logo_url: tenant?.logo_url ?? null,
      primary_color: tenant?.primary_color ?? null,
      accent_color: tenant?.accent_color ?? null,
    },
    location,
    lineItems: ((items ?? []) as Array<{ description: string; quantity: number; unit_price: number | string }>).map(
      (i) => ({
        description: i.description,
        quantity: Number(i.quantity) || 0,
        unit_price: Number(i.unit_price) || 0,
      })
    ),
  };

  const bytes = await renderInvoicePdf(pdfInput);
  const path = `${inv.tenant_id}/${invoiceId}.pdf`;

  // Upload (upsert)
  const { error: upErr } = await db.storage.from(BUCKET).upload(path, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upErr) {
    throw new Error(`Storage upload failed: ${upErr.message}`);
  }

  const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path);
  const pdfUrl: string = pub?.publicUrl;
  if (!pdfUrl) throw new Error("Failed to resolve public URL");

  await db
    .from("invoices")
    .update({ pdf_url: pdfUrl, pdf_generated_at: new Date().toISOString() })
    .eq("id", invoiceId);

  return pdfUrl;
}

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const url = await generateAndUpload(id);
    return NextResponse.json({ pdf_url: url });
  } catch (err) {
    console.error("[invoices/pdf] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getServiceClient() as any;
    const { data: row } = await db
      .from("invoices")
      .select("pdf_url")
      .eq("id", id)
      .maybeSingle();
    if (row?.pdf_url) return NextResponse.json({ pdf_url: row.pdf_url });
    const url = await generateAndUpload(id);
    return NextResponse.json({ pdf_url: url });
  } catch (err) {
    console.error("[invoices/pdf] GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
