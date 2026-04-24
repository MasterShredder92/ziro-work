import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const familyId = params.id;
    if (!familyId) {
      return NextResponse.json({ error: "Missing family id" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Fetch last 12 months of Square invoices for this family
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    const cutoff = twelveMonthsAgo.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("square_invoices")
      .select(
        "id, square_invoice_id, invoice_number, title, status, amount_cents, requested_amount, amount_paid, due_date, paid_at, square_created_at, customer_name, customer_email"
      )
      .eq("family_id", familyId)
      .gte("square_created_at", cutoff)
      .order("square_created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[square-invoices] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], count: (data ?? []).length });
  } catch (err) {
    console.error("[square-invoices] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
