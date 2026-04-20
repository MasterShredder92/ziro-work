import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const url = new URL(req.url);
    const month = url.searchParams.get("month"); // YYYY-MM

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (db as any)
      .from("expenses")
      .select("id,amount_cents,category,description,effective_date,end_date,frequency,is_recurring,location_id,created_at")
      .eq("tenant_id", tenantId)
      .order("effective_date", { ascending: false });

    if (month) {
      const start = `${month}-01`;
      const end = new Date(
        parseInt(month.split("-")[0]),
        parseInt(month.split("-")[1]),
        0
      ).toISOString().split("T")[0];
      query = query.gte("effective_date", start).lte("effective_date", end);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[expenses GET]", err);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const body = await req.json();

    const row = {
      tenant_id: tenantId,
      amount_cents: body.amount_cents ?? Math.round((body.amount ?? 0) * 100),
      category: body.category ?? "Other",
      description: body.label ?? body.description ?? "",
      effective_date: body.date ?? body.effective_date ?? new Date().toISOString().split("T")[0],
      is_recurring: body.recurring ?? body.is_recurring ?? false,
      frequency: body.frequency ?? null,
      location_id: body.location_id ?? null,
      end_date: body.end_date ?? null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any)
      .from("expenses")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("[expenses POST]", err);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
