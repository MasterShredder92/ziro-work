import { NextRequest, NextResponse } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") || DEFAULT_TENANT_ID;
  const status = url.searchParams.get("status") || null;
  const supabase = await createTenantBoundSupabaseClient({ tenantId });
  let query = supabase
    .from("recruitment_prospects")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const tenantId = DEFAULT_TENANT_ID;
  const body = await req.json();
  const supabase = await createTenantBoundSupabaseClient({ tenantId });
  const { data, error } = await supabase
    .from("recruitment_prospects")
    .insert({ ...body, tenant_id: tenantId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = await createTenantBoundSupabaseClient();
  const { data, error } = await supabase
    .from("recruitment_prospects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = await createTenantBoundSupabaseClient();
  const { error } = await supabase.from("recruitment_prospects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
