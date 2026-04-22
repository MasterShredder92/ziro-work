/**
 * /api/settings/services
 *
 * Services & Items catalog CRUD.
 * GET  — list all services for tenant
 * POST — create a new service
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tenantId(req: NextRequest) {
  return req.headers.get("x-tenant-id") || DEFAULT_TENANT_ID;
}

export async function GET(req: NextRequest) {
  const db = getServiceClient();
  const tid = tenantId(req);

  const { data, error } = await db
    .from("services_catalog")
    .select("id, name, sub_category, description, unit_price, unit_label, is_core, sort_order, active, taxable")
    .eq("tenant_id", tid)
    .order("is_core", { ascending: false })
    .order("sort_order")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

const CreateSchema = z.object({
  name: z.string().min(1).max(255),
  sub_category: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  unit_price: z.number().min(0),
  unit_label: z.string().max(50).default("session"),
  is_core: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  active: z.boolean().default(true),
  taxable: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getServiceClient();
  const tid = tenantId(req);

  const { data, error } = await db
    .from("services_catalog")
    .insert({ ...parsed.data, tenant_id: tid })
    .select("id, name, sub_category, unit_price, unit_label, is_core, sort_order, active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
