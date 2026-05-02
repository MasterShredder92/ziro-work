/**
 * /api/invoices/create
 *
 * Full Invoice Builder endpoint.
 * - Writes to invoices + invoice_items tables
 * - Supports recurring billing (is_recurring = true, sends 1st of each month)
 * - Auto-saves to family record via family_id
 * - No manual link sharing — invoice is accessible via /invoice/[token] and on family page
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
  student_id: z.string().uuid().nullable().optional(),
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
  is_recurring: z.boolean().optional().default(true),
  recurring_day: z.number().int().min(1).max(28).optional().default(1),
  push_to_square: z.boolean().optional().default(false),
  line_items: z.array(LineItemSchema).min(1),
});

/** Compute next invoice date: 1st of the month after due_date */
function nextInvoiceDate(dueDate: string, recurringDay: number): string {
  const d = new Date(dueDate);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, recurringDay);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

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
      is_recurring,
      recurring_day,
      push_to_square,
      line_items,
    } = parsed.data;

    const tenantId =
      req.headers.get("x-tenant-id") ||
      new URL(req.url).searchParams.get("tenantId") ||
      DEFAULT_TENANT_ID;

    const db = getServiceClient();

    // ── Compute invoice_month and next_invoice_date ────────────
    const dueDateObj = new Date(due_date);
    const invoiceMonth = `${dueDateObj.getFullYear()}-${String(dueDateObj.getMonth() + 1).padStart(2, "0")}`;
    const nextDate = is_recurring ? nextInvoiceDate(due_date, recurring_day) : null;

    // ── 1. Insert into invoices table ──────────────────────────
    const { data: invoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        tenant_id: tenantId,
        family_id: family_id ?? null,
        location_id: location_id ?? null,
        status: is_recurring ? "scheduled" : "open",
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
        is_recurring,
        recurring_day,
        next_invoice_date: nextDate,
        invoice_month: invoiceMonth,
        metadata: { customer_name, customer_email: customer_email ?? null },
      })
      .select("id, status, total_cents, due_date, live_url_token, is_recurring, next_invoice_date")
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
      const itemRows = line_items.map((item, idx) => {
        const unitCents = Math.round(item.unit_price * 100);
        const totalCents = Math.round(unitCents * item.quantity);
        return {
          tenant_id: tenantId,
          invoice_id: invoice.id,
          student_id: item.student_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit_amount_cents: unitCents,
          amount_cents: totalCents,
          taxable: false,
          sort_order: idx,
          metadata: {
            is_makeup_session: item.is_makeup_session ?? false,
            is_fifth_week: item.is_fifth_week ?? false,
            session_date: item.session_date ?? null,
          },
        };
      });

      const { error: itemsError } = await db.from("invoice_line_items").insert(itemRows);
      if (itemsError) {
        console.warn("[invoices/create] Line items insert failed (non-fatal):", itemsError.message);
      }
    }

    // ── 3. Generate PDF + upload to storage (non-fatal) ──
    let pdfUrl: string | null = null;
    try {
      const { renderInvoicePdf } = await import("@/lib/invoice/pdf");
      const { data: tenantRow } = await db
        .from("tenants")
        .select("name, logo_url, primary_color, accent_color")
        .eq("id", tenantId)
        .maybeSingle();
      let locationRow: {
        name: string | null;
        address_line1: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        phone: string | null;
        email: string | null;
        google_review_url: string | null;
      } | null = null;
      if (location_id) {
        const { data: loc } = await db
          .from("locations")
          .select("name, address_line1, city, state, postal_code, phone, email, google_review_url")
          .eq("id", location_id)
          .maybeSingle();
        locationRow = loc ?? null;
      }
      const bytes = await renderInvoicePdf({
        invoice: {
          id: invoice.id,
          number: null,
          issued_at: new Date().toISOString(),
          due_date,
          total_cents,
          subtotal_cents,
          balance_cents: total_cents,
          notes: notes ?? null,
          google_review_enabled,
          is_recurring,
          status: is_recurring ? "SCHEDULED" : "OPEN",
        },
        customer: { name: customer_name, email: customer_email ?? null },
        tenant: {
          name: tenantRow?.name ?? "ZiroWork",
          logo_url: tenantRow?.logo_url ?? null,
          primary_color: tenantRow?.primary_color ?? null,
          accent_color: tenantRow?.accent_color ?? null,
        },
        location: locationRow,
        lineItems: line_items.map((li) => ({ description: li.description, quantity: li.quantity, unit_price: li.unit_price })),
      });
      const path = `${tenantId}/${invoice.id}.pdf`;
      const { error: upErr } = await db.storage.from("invoice-pdfs").upload(path, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (!upErr) {
        const { data: pub } = db.storage.from("invoice-pdfs").getPublicUrl(path);
        pdfUrl = pub?.publicUrl ?? null;
        if (pdfUrl) {
          await db
            .from("invoices")
            .update({ pdf_url: pdfUrl, pdf_generated_at: new Date().toISOString() })
            .eq("id", invoice.id);
        }
      } else {
        console.warn("[invoices/create] PDF upload failed (non-fatal):", upErr.message);
      }
    } catch (e) {
      console.warn("[invoices/create] PDF generation failed (non-fatal):", e);
    }

    // ── 4. Push to Square so Square handles charging + emails + retries ──
    // Gated behind explicit opt-in flag to prevent accidental double-billing
    // while migrating off Square's native recurring schedules.
    let squareInvoiceId: string | null = null;
    let squarePublicUrl: string | null = null;
    let squarePushError: string | null = null;
    let autoCharge = false;
    if (push_to_square && family_id && location_id) {
      try {
        const [{ data: famRow }, { data: locRow }] = await Promise.all([
          db
            .from("families")
            .select("id, tenant_id, name, primary_email, primary_phone, square_customer_id, square_card_id")
            .eq("id", family_id)
            .maybeSingle(),
          db
            .from("locations")
            .select("square_location_id")
            .eq("id", location_id)
            .maybeSingle(),
        ]);

        if (!locRow?.square_location_id) {
          squarePushError = "Location has no Square location ID configured.";
        } else if (!famRow) {
          squarePushError = "Family record not found.";
        } else {
          // Resolve (or create) Square customer for this family
          const { resolveSquareCustomer } = await import("@/lib/billing/squareCustomerResolver");
          const resolved = await resolveSquareCustomer({
            id: famRow.id,
            tenant_id: famRow.tenant_id ?? tenantId,
            name: famRow.name ?? null,
            primary_email: famRow.primary_email ?? null,
            primary_phone: famRow.primary_phone ?? null,
            square_customer_id: famRow.square_customer_id ?? null,
          });
          const { pushInvoiceToSquare } = await import("@/lib/billing/squarePush");
          const pushArgs = {
            squareLocationId: locRow.square_location_id,
            squareCardId: famRow.square_card_id ?? null,
            invoiceTitle: notes?.slice(0, 80) || `Lessons — ${customer_name}`,
            description: notes ?? null,
            dueDate: due_date,
            lineItems: line_items.map((li) => ({
              name: li.description,
              quantity: li.quantity,
              unitPriceCents: Math.round(li.unit_price * 100),
            })),
            idempotencyKey: invoice.id,
          };
          let result: Awaited<ReturnType<typeof pushInvoiceToSquare>>;
          try {
            result = await pushInvoiceToSquare({
              ...pushArgs,
              squareCustomerId: resolved.squareCustomerId,
            });
          } catch (firstErr) {
            const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
            if (msg.includes("[STALE_CUSTOMER]")) {
              // Cached Square customer was deleted on Square side. Null cache + re-resolve.
              await db
                .from("families")
                .update({ square_customer_id: null, square_card_id: null })
                .eq("id", famRow.id);
              const reResolved = await resolveSquareCustomer({
                id: famRow.id,
                tenant_id: famRow.tenant_id ?? tenantId,
                name: famRow.name ?? null,
                primary_email: famRow.primary_email ?? null,
                primary_phone: famRow.primary_phone ?? null,
                square_customer_id: null,
              });
              result = await pushInvoiceToSquare({
                ...pushArgs,
                squareCustomerId: reResolved.squareCustomerId,
                idempotencyKey: `${invoice.id}-r1`,
              });
            } else {
              throw firstErr;
            }
          }
          squareInvoiceId = result.squareInvoiceId;
          squarePublicUrl = result.publicUrl;
          autoCharge = result.autoCharge;
          await db
            .from("invoices")
            .update({
              square_invoice_id: result.squareInvoiceId,
              square_order_id: result.squareOrderId,
              square_public_url: result.publicUrl,
              square_pushed_at: new Date().toISOString(),
              square_push_error: null,
            })
            .eq("id", invoice.id);
        }
      } catch (e) {
        squarePushError = e instanceof Error ? e.message : String(e);
        console.error("[invoices/create] Square push failed:", squarePushError);
        await db
          .from("invoices")
          .update({ square_push_error: squarePushError })
          .eq("id", invoice.id);
      }
    } else if (push_to_square) {
      squarePushError = "Skipped Square push: no family_id or location_id.";
    }

    return NextResponse.json({
      data: {
        ...invoice,
        pdf_url: pdfUrl,
        square_invoice_id: squareInvoiceId,
        square_public_url: squarePublicUrl,
        square_auto_charge: autoCharge,
        square_push_error: squarePushError,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[invoices/create] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
