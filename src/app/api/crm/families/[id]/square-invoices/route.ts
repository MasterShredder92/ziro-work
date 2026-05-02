/**
 * GET /api/crm/families/:id/square-invoices
 *
 * Returns the family's invoice ledger for the last 12 months.
 * UNIONs two sources so the family page reflects everything:
 *   1. `square_invoices` — invoices synced from Square
 *   2. `invoices` — invoices created in-app via /api/invoices/create
 *
 * Both shapes are normalized to the SquareInvoiceRow contract the UI expects.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  square_invoice_id: string | null;
  invoice_number: string | null;
  title: string | null;
  status: string | null;
  amount_cents: number | null;
  requested_amount: number | null;
  amount_paid: number | null;
  due_date: string | null;
  paid_at: string | null;
  square_created_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  source: "square" | "manual";
  live_url_token?: string | null;
  pdf_url?: string | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params;
    if (!familyId) {
      return NextResponse.json({ error: "Missing family id" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getServiceClient() as any;

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const cutoff = twelveMonthsAgo.toISOString().split("T")[0];
    const cutoffTs = twelveMonthsAgo.toISOString();

    // ── 1. Square-synced invoices ──
    const { data: sqRaw, error: sqErr } = await supabase
      .from("square_invoices")
      .select(
        "id, square_invoice_id, invoice_number, title, status, amount_cents, requested_amount, amount_paid, due_date, paid_at, square_created_at, customer_name, customer_email"
      )
      .eq("family_id", familyId)
      .gte("square_created_at", cutoff)
      .order("square_created_at", { ascending: false })
      .limit(100);

    if (sqErr) {
      console.error("[square-invoices] square_invoices error:", sqErr);
    }

    const square: Row[] = ((sqRaw ?? []) as Record<string, unknown>[]).map(
      (r) => ({
        id: String(r.id),
        square_invoice_id: (r.square_invoice_id as string | null) ?? null,
        invoice_number: (r.invoice_number as string | null) ?? null,
        title: (r.title as string | null) ?? null,
        status: (r.status as string | null) ?? null,
        amount_cents: (r.amount_cents as number | null) ?? null,
        requested_amount: (r.requested_amount as number | null) ?? null,
        amount_paid: (r.amount_paid as number | null) ?? null,
        due_date: (r.due_date as string | null) ?? null,
        paid_at: (r.paid_at as string | null) ?? null,
        square_created_at: (r.square_created_at as string | null) ?? null,
        customer_name: (r.customer_name as string | null) ?? null,
        customer_email: (r.customer_email as string | null) ?? null,
        source: "square",
      })
    );

    // ── 2. In-app manually-created invoices ──
    const { data: inRaw, error: inErr } = await supabase
      .from("invoices")
      .select(
        "id, number, description, status, total_cents, amount_paid_cents, due_date, paid_at, issued_at, created_at, metadata, live_url_token, pdf_url"
      )
      .eq("family_id", familyId)
      .is("archived_at", null)
      .gte("created_at", cutoffTs)
      .order("created_at", { ascending: false })
      .limit(100);

    if (inErr) {
      console.error("[square-invoices] invoices error:", inErr);
    }

    const manual: Row[] = ((inRaw ?? []) as Record<string, unknown>[]).map(
      (r) => {
        const meta = (r.metadata ?? {}) as {
          customer_name?: string;
          customer_email?: string;
        };
        return {
          id: String(r.id),
          square_invoice_id: null,
          invoice_number: (r.number as string | null) ?? null,
          title: (r.description as string | null) ?? "Invoice",
          status: (r.status as string | null)?.toUpperCase() ?? null,
          amount_cents: (r.total_cents as number | null) ?? null,
          requested_amount: (r.total_cents as number | null) ?? null,
          amount_paid: (r.amount_paid_cents as number | null) ?? null,
          due_date: (r.due_date as string | null) ?? null,
          paid_at: (r.paid_at as string | null) ?? null,
          square_created_at:
            (r.issued_at as string | null) ??
            (r.created_at as string | null) ??
            null,
          customer_name: meta.customer_name ?? null,
          customer_email: meta.customer_email ?? null,
          source: "manual",
          live_url_token: (r.live_url_token as string | null) ?? null,
          pdf_url: (r.pdf_url as string | null) ?? null,
        };
      }
    );

    // ── Merge + sort desc by date ──
    const merged = [...square, ...manual].sort((a, b) => {
      const ta = a.square_created_at ? Date.parse(a.square_created_at) : 0;
      const tb = b.square_created_at ? Date.parse(b.square_created_at) : 0;
      return tb - ta;
    });

    return NextResponse.json({ data: merged, count: merged.length });
  } catch (err) {
    console.error("[square-invoices] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
