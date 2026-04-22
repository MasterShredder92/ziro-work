import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tenantId(req: NextRequest) {
  return req.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

const UpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sub_category: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  unit_price: z.number().min(0).optional(),
  unit_label: z.string().max(50).optional(),
  is_core: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
  taxable: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getServiceClient();
  const tid = tenantId(req);

  const { data, error } = await db
    .from("services_catalog")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tid)
    .select("id, name, sub_category, unit_price, active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getServiceClient();
  const tid = tenantId(req);

  // Soft delete — set active = false
  const { error } = await db
    .from("services_catalog")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tid);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
