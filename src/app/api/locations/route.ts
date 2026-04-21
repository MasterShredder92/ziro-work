/**
 * /api/locations
 * Returns all locations for a tenant.
 * Used by teacher profile page and other places that need the full location list.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantId =
      req.headers.get("x-tenant-id") ||
      url.searchParams.get("tenantId") ||
      DEFAULT_TENANT_ID;

    const db = getServiceClient();
    const { data, error } = await db
      .from("locations")
      .select("id, name, address, city, state, zip, phone, email, is_active, color, timezone")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
