import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db as any)
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[expenses DELETE]", err);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    if (body.amount_cents !== undefined) updates.amount_cents = body.amount_cents;
    if (body.amount !== undefined) updates.amount_cents = Math.round(body.amount * 100);
    if (body.category !== undefined) updates.category = body.category;
    if (body.label !== undefined) updates.description = body.label;
    if (body.description !== undefined) updates.description = body.description;
    if (body.date !== undefined) updates.effective_date = body.date;
    if (body.effective_date !== undefined) updates.effective_date = body.effective_date;
    if (body.is_recurring !== undefined) updates.is_recurring = body.is_recurring;
    if (body.recurring !== undefined) updates.is_recurring = body.recurring;
    if (body.frequency !== undefined) updates.frequency = body.frequency;
    if (body.location_id !== undefined) updates.location_id = body.location_id;
    updates.updated_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any)
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[expenses PATCH]", err);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}
