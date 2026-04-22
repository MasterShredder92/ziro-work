/**
 * /api/families/search
 *
 * Fast family search for invoice builder autocomplete.
 * Returns id, name, primary_email, primary_phone.
 * No auth required — uses service role (internal only).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const tenantId =
    req.headers.get("x-tenant-id") ||
    url.searchParams.get("tenantId") ||
    DEFAULT_TENANT_ID;

  if (q.length < 1) {
    return NextResponse.json({ data: [] });
  }

  const db = getServiceClient();
  const term = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const { data, error } = await db
    .from("families")
    .select("id, name, primary_email, primary_phone, primary_contact_name")
    .eq("tenant_id", tenantId)
    .is("archived_at", null)
    .or(`name.ilike.${term},primary_email.ilike.${term},primary_phone.ilike.${term},primary_contact_name.ilike.${term}`)
    .order("name")
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
