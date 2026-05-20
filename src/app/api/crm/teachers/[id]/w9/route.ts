/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { resolveCRMContext } from "../../../_context";

/**
 * GET  /api/crm/teachers/[id]/w9  — fetch latest W9 for teacher
 * POST /api/crm/teachers/[id]/w9  — submit / upsert W9 for teacher
 */

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  req: NextRequest,
  ctx: RouteContext
) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;

  const { id } = await ctx.params;
  const tenantId = resolved.context.tenantId;
  const db = await createTenantBoundSupabaseClient({ tenantId });

  const { data, error } = await (db as any)
    .from("teacher_w9")
    .select("id, teacher_id, tenant_id, legal_name, business_name, tax_classification, tax_classification_other, address, city, state, zip, tin_type, tin_last_four, signature_name, exempt_payee_code, fatca_exemption_code, signed_at, status, pdf_url, pdf_generated_at, created_at, updated_at")
    .eq("teacher_id", id)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ error: "teacher_w9 table not found. Run the migration SQL in Supabase first." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext
) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;

  const { id } = await ctx.params;
  const tenantId = resolved.context.tenantId;
  const db = await createTenantBoundSupabaseClient({ tenantId });

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    legal_name,
    business_name,
    tax_classification,
    tax_classification_other,
    address,
    city,
    state,
    zip,
    tin_type,
    tin, // raw TIN from client — we derive tin_encrypted and tin_last_four server-side
    signature_name,
    exempt_payee_code,
    fatca_exemption_code,
  } = body;

  // Basic validation
  if (!legal_name || !address || !city || !state || !zip || !tin_type || !tin || !signature_name || !tax_classification) {
    return NextResponse.json({ error: "Missing required W9 fields" }, { status: 400 });
  }

  // Strip non-digits and derive last four + masked storage value
  const tinDigits = String(tin).replace(/\D/g, "");
  if (tinDigits.length < 4) {
    return NextResponse.json({ error: "TIN must contain at least 4 digits" }, { status: 400 });
  }
  const tin_last_four = tinDigits.slice(-4);
  const tin_encrypted = `****${tin_last_four}`; // mask for storage

  const now = new Date().toISOString();

  // Upsert into teacher_w9 (by teacher_id + tenant_id — one active W9 per teacher)
  const { data: w9, error: w9Error } = await (db as any)
    .from("teacher_w9")
    .upsert(
      {
        teacher_id: id,
        tenant_id: tenantId,
        legal_name,
        business_name: business_name || null,
        tax_classification,
        tax_classification_other: tax_classification_other || null,
        address,
        city,
        state,
        zip,
        tin_type,
        tin_encrypted,
        tin_last_four,
        signature_name,
        exempt_payee_code: exempt_payee_code || null,
        fatca_exemption_code: fatca_exemption_code || null,
        signed_at: now,
        status: "complete",
        updated_at: now,
      },
      { onConflict: "teacher_id,tenant_id" }
    )
    .select()
    .single();

  if (w9Error) {
    if (w9Error.code === "42P01") {
      return NextResponse.json(
        { error: "teacher_w9 table not found. Run the migration SQL in Supabase first." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: w9Error.message }, { status: 500 });
  }

  // Update teacher record: set w9_status = "complete" and w9_completed_at
  await (db as any)
    .from("teachers")
    .update({ w9_status: "complete", w9_completed_at: now, updated_at: now })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  // Never return the encrypted TIN in the response
  const { tin_encrypted: _omitTin, ...safeW9 } = w9 as Record<string, unknown>;
  void _omitTin; // intentionally excluded from response
  return NextResponse.json({ ok: true, data: safeW9 });
}
