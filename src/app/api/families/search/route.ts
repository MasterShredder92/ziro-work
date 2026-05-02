/**
 * GET /api/families/search?q=...
 * Lightweight typeahead search for the Create Invoice modal.
 * Returns id, name, primary_email, primary_phone, primary_contact_name,
 * primary_location_id and rate_tier so the modal can auto-fill location + price.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tenantId =
    req.headers.get("x-tenant-id")?.trim() || DEFAULT_TENANT_ID;

  if (q.length < 1) {
    return NextResponse.json({ data: [], count: 0 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getServiceClient() as any;
    const safe = q.replace(/[%,]/g, " ");
    const pattern = `%${safe}%`;

    const { data, error } = await db
      .from("families")
      .select(
        "id, name, primary_email, primary_phone, primary_contact_name, primary_location_id, rate_tier"
      )
      .eq("tenant_id", tenantId)
      .is("archived_at", null)
      .or(
        `name.ilike.${pattern},primary_email.ilike.${pattern},primary_phone.ilike.${pattern},primary_contact_name.ilike.${pattern}`
      )
      .order("name", { ascending: true })
      .limit(15);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], count: (data ?? []).length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
