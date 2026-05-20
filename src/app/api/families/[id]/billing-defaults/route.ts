/**
 * GET /api/families/:id/billing-defaults
 * Returns the data needed to auto-populate a New Invoice for this family:
 *   - location: primary_location_id + name + color
 *   - rate_per_session_cents (from families.rate_tier)
 *   - students[]: active students with sessions_per_month + instrument
 *   - line_items[]: prebuilt line item suggestions (one per active student)
 *
 * Null/missing handling:
 *   - If a student's sessions_per_month is null, we fall back to 4 and flag
 *     `sessions_estimated: true` so the UI can show a warning pill.
 *   - If rate_tier is missing, unit_price = 0 and `rate_missing: true`.
 */
import { NextRequest, NextResponse } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = new Set(["active", "trial", "Active", "Trial"]);
const DEFAULT_SESSIONS_PER_MONTH = 4;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const tenantId =
    req.headers.get("x-tenant-id")?.trim() || DEFAULT_TENANT_ID;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = await createTenantBoundSupabaseClient({ tenantId }) as any;

    // ── Family ──
    const { data: fam, error: famErr } = await db
      .from("families")
      .select(
        "id, name, primary_email, primary_contact_name, primary_location_id, rate_tier"
      )
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();

    if (famErr) {
      return NextResponse.json({ error: famErr.message }, { status: 500 });
    }
    if (!fam) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    // ── Location ──
    let location: {
      id: string;
      name: string;
      color: string | null;
      square_location_id: string | null;
    } | null = null;
    if (fam.primary_location_id) {
      const { data: loc } = await db
        .from("locations")
        .select("id, name, color, square_location_id")
        .eq("tenant_id", tenantId)
        .eq("id", fam.primary_location_id)
        .maybeSingle();
      location = loc ?? null;
    }

    // ── Active students ──
    const { data: studentsRaw, error: stuErr } = await db
      .from("students")
      .select(
        "id, first_name, last_name, status, instrument, sessions_per_month, blocks_per_week"
      )
      .eq("tenant_id", tenantId)
      .eq("family_id", id)
      .is("archived_at", null);

    if (stuErr) {
      return NextResponse.json({ error: stuErr.message }, { status: 500 });
    }

    type DBStudent = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      status: string | null;
      instrument: string | null;
      sessions_per_month: number | null;
      blocks_per_week: number | null;
    };

    const activeStudents = ((studentsRaw ?? []) as DBStudent[]).filter(
      (s) => !s.status || ACTIVE_STATUSES.has(s.status)
    );

    const ratePerSessionCents: number =
      typeof fam.rate_tier === "number" && fam.rate_tier > 0
        ? fam.rate_tier
        : 0;
    const rateMissing = ratePerSessionCents === 0;
    const unitPriceDollars = ratePerSessionCents / 100;

    const lineItems = activeStudents.map((s) => {
      const fullName = [s.first_name, s.last_name].filter(Boolean).join(" ") || "Student";
      const instrument = s.instrument?.trim() || "Music";
      const sessionsRaw = s.sessions_per_month;
      const sessionsEstimated = sessionsRaw == null || sessionsRaw <= 0;
      const sessions = sessionsEstimated
        ? DEFAULT_SESSIONS_PER_MONTH
        : sessionsRaw;
      return {
        student_id: s.id,
        student_name: fullName,
        instrument,
        description: `${instrument} Sessions — ${fullName}`,
        quantity: sessions,
        unit_price: unitPriceDollars,
        sessions_estimated: sessionsEstimated,
        rate_missing: rateMissing,
      };
    });

    return NextResponse.json({
      family: {
        id: fam.id,
        name: fam.name,
        primary_email: fam.primary_email,
        primary_contact_name: fam.primary_contact_name,
      },
      location,
      rate_per_session_cents: ratePerSessionCents,
      rate_missing: rateMissing,
      active_student_count: activeStudents.length,
      line_items: lineItems,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
