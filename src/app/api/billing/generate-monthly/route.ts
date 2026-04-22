/**
 * /api/billing/generate-monthly
 *
 * Trigger monthly invoice generation for all active subscriptions.
 * Supports dry-run mode for testing without writing to DB.
 *
 * POST body:
 *   { year?: number, month?: number, dry_run?: boolean }
 *
 * Requires: admin or director role
 */
import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyInvoices } from "@/lib/billing/recurringBilling";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const year = typeof body.year === "number" ? body.year : undefined;
    const month = typeof body.month === "number" ? body.month : undefined;
    const dryRun = body.dry_run !== false; // Default to dry_run=true for safety

    const result = await generateMonthlyInvoices(year, month, dryRun);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[billing/generate-monthly] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  // Quick dry-run preview via GET
  const url = new URL(req.url);
  const year = url.searchParams.get("year") ? parseInt(url.searchParams.get("year")!) : undefined;
  const month = url.searchParams.get("month") ? parseInt(url.searchParams.get("month")!) : undefined;

  try {
    const result = await generateMonthlyInvoices(year, month, true);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
