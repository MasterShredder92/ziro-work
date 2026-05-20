/**
 * POST /api/internal/square-bridge-families
 *
 * Walks all families WHERE square_customer_id IS NULL,
 * tries to resolve via Square (search email → search phone → create),
 * caches the result back to families.square_customer_id.
 *
 * Body (optional):
 *   { dryRun?: boolean, tenantId?: string, limit?: number }
 *
 * Returns:
 *   { processed, matched_email, matched_phone, created, no_contact, errors[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { resolveSquareCustomer } from "@/lib/billing/squareCustomerResolver";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  assertServiceRoleAllowed("Internal Square repair tool — no user session, admin-only bulk repair");
  // Auth: require x-internal-key header matching INTERNAL_API_KEY env var.
  // If env var is unset, refuse the call entirely (fail-closed).
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (!expectedKey) {
    return NextResponse.json({ error: "INTERNAL_API_KEY not configured" }, { status: 503 });
  }
  const providedKey = req.headers.get("x-internal-key");
  if (providedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return NextResponse.json({ error: "SQUARE_ACCESS_TOKEN not configured" }, { status: 503 });
  }

  let body: { dryRun?: boolean; tenantId?: string; limit?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const dryRun = !!body.dryRun;
  const tenantId = body.tenantId || DEFAULT_TENANT_ID;
  const limit = Math.min(body.limit ?? 100, 200);

  const db = getServiceClient();
  const { data: rows, error } = await db
    .from("families")
    .select("id, tenant_id, name, primary_email, primary_phone, square_customer_id")
    .eq("tenant_id", tenantId)
    .is("square_customer_id", null)
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type RunResult = {
    processed: number;
    matched_email: number;
    matched_phone: number;
    created: number;
    no_contact: number;
    errors: Array<{ family_id: string; name: string | null; error: string }>;
    samples: Array<{ family_id: string; name: string | null; source: string; square_customer_id: string }>;
  };
  const result: RunResult = {
    processed: 0,
    matched_email: 0,
    matched_phone: 0,
    created: 0,
    no_contact: 0,
    errors: [],
    samples: [],
  };

  for (const f of rows ?? []) {
    if (!f.primary_email && !f.primary_phone && !f.name) {
      result.no_contact++;
      continue;
    }
    try {
      const r = await resolveSquareCustomer(
        {
          id: f.id,
          tenant_id: f.tenant_id,
          name: f.name,
          primary_email: f.primary_email,
          primary_phone: f.primary_phone,
          square_customer_id: null,
        },
        { dryRun }
      );
      result.processed++;
      if (r.matchSource === "search_email") result.matched_email++;
      else if (r.matchSource === "search_phone") result.matched_phone++;
      else if (r.matchSource === "created") result.created++;
      if (result.samples.length < 25) {
        result.samples.push({
          family_id: f.id,
          name: f.name,
          source: r.matchSource,
          square_customer_id: r.squareCustomerId,
        });
      }
    } catch (e) {
      result.errors.push({
        family_id: f.id,
        name: f.name,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ data: result, dry_run: dryRun }, { status: 200 });
}
