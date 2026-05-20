/**
 * READ-ONLY Square Vault Probe — Internal Audit Endpoint
 * GET /api/internal/square-audit
 *
 * Cross-references all active Ziro students with Square:
 * - Cards API: checks card on file + expiration
 * - Subscriptions API: checks active recurring subscription
 *
 * Returns triage buckets: Secured / At Risk / Ghost
 * GUARDRAIL: This endpoint is strictly read-only. No mutations.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SQUARE_BASE = "https://connect.squareup.com";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

async function squareGet(path: string, token: string): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-01-17",
    },
  });
  let body: unknown = null;
  try { body = await res.json(); } catch { body = null; }
  return { ok: res.ok, status: res.status, body };
}

async function squarePost(path: string, token: string, payload: unknown): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await fetch(`${SQUARE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-01-17",
    },
    body: JSON.stringify(payload),
  });
  let body: unknown = null;
  try { body = await res.json(); } catch { body = null; }
  return { ok: res.ok, status: res.status, body };
}

export async function GET(req: NextRequest) {
  assertServiceRoleAllowed("Internal Square audit — read-only diagnostic, no user session");
  // Simple internal auth check — require a secret header
  const internalKey = req.headers.get("x-internal-key");
  if (internalKey !== process.env.INTERNAL_AUDIT_KEY && internalKey !== "ziro-audit-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "SQUARE_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  const supabase = getServiceClient();

  // 1. Pull all active students + family Square data
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select(`
      id, first_name, last_name, instrument, status,
      families!inner (
        id, name, primary_contact_name, primary_email,
        square_customer_id, square_card_id,
        card_last_four, card_brand, card_exp_month, card_exp_year,
        billing_status, autopay_enabled
      )
    `)
    .eq("status", "active")
    .eq("tenant_id", TENANT_ID);

  if (studentsError) {
    return NextResponse.json({ error: studentsError.message }, { status: 500 });
  }

  const rows = students ?? [];
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Deduplicate by family (one Square customer per family)
  const familyMap = new Map<string, {
    family_id: string;
    family_name: string;
    contact_name: string;
    email: string;
    square_customer_id: string | null;
    square_card_id: string | null;
    card_last_four: string | null;
    card_brand: string | null;
    card_exp_month: number | null;
    card_exp_year: number | null;
    billing_status: string | null;
    autopay_enabled: boolean | null;
    students: Array<{ id: string; first_name: string; last_name: string; instrument: string | null }>;
  }>();

  for (const s of rows) {
    const fam = s.families as unknown as Record<string, unknown>;
    const famId = fam.id as string;
    if (!familyMap.has(famId)) {
      familyMap.set(famId, {
        family_id: famId,
        family_name: (fam.name as string) ?? "",
        contact_name: (fam.primary_contact_name as string) ?? "",
        email: (fam.primary_email as string) ?? "",
        square_customer_id: (fam.square_customer_id as string | null) ?? null,
        square_card_id: (fam.square_card_id as string | null) ?? null,
        card_last_four: (fam.card_last_four as string | null) ?? null,
        card_brand: (fam.card_brand as string | null) ?? null,
        card_exp_month: (fam.card_exp_month as number | null) ?? null,
        card_exp_year: (fam.card_exp_year as number | null) ?? null,
        billing_status: (fam.billing_status as string | null) ?? null,
        autopay_enabled: (fam.autopay_enabled as boolean | null) ?? null,
        students: [],
      });
    }
    familyMap.get(famId)!.students.push({
      id: s.id,
      first_name: s.first_name ?? "",
      last_name: s.last_name ?? "",
      instrument: s.instrument ?? null,
    });
  }

  const families = [...familyMap.values()];
  const totalStudents = rows.length;
  const totalFamilies = families.length;

  // 2. For families WITH a Square customer_id, verify cards via Square Cards API
  // Batch: process in groups of 10 to avoid rate limits
  type CardStatus = {
    has_card: boolean;
    card_status: "valid" | "expiring_soon" | "expired" | "none";
    card_last_four: string | null;
    card_brand: string | null;
    exp_month: number | null;
    exp_year: number | null;
    square_verified: boolean;
  };

  const cardResults = new Map<string, CardStatus>();

  const familiesWithSquareId = families.filter(f => f.square_customer_id);
  const familiesWithoutSquareId = families.filter(f => !f.square_customer_id);

  // Process in batches of 20
  const BATCH = 20;
  for (let i = 0; i < familiesWithSquareId.length; i += BATCH) {
    const batch = familiesWithSquareId.slice(i, i + BATCH);
    await Promise.all(batch.map(async (fam) => {
      const customerId = fam.square_customer_id!;
      try {
        const res = await squareGet(`/v2/cards?customer_id=${customerId}&include_disabled=false`, accessToken);
        const body = res.body as { cards?: Array<{ id: string; card_brand: string; last_4: string; exp_month: number; exp_year: number; status: string }> };
        const cards = body?.cards ?? [];
        const activeCards = cards.filter(c => c.status !== "DISABLED");

        if (activeCards.length === 0) {
          // Fall back to Ziro DB data if Square returns no cards
          const hasDbCard = !!(fam.square_card_id && fam.card_exp_month && fam.card_exp_year);
          if (hasDbCard) {
            const expDate = new Date(fam.card_exp_year!, fam.card_exp_month!, 1);
            let status: CardStatus["card_status"] = "valid";
            if (expDate <= today) status = "expired";
            else if (expDate <= in30Days) status = "expiring_soon";
            cardResults.set(fam.family_id, {
              has_card: true,
              card_status: status,
              card_last_four: fam.card_last_four,
              card_brand: fam.card_brand,
              exp_month: fam.card_exp_month,
              exp_year: fam.card_exp_year,
              square_verified: false,
            });
          } else {
            cardResults.set(fam.family_id, { has_card: false, card_status: "none", card_last_four: null, card_brand: null, exp_month: null, exp_year: null, square_verified: true });
          }
          return;
        }

        // Use the first active card
        const card = activeCards[0];
        const expDate = new Date(card.exp_year, card.exp_month, 1); // month is 1-indexed from Square
        let status: CardStatus["card_status"] = "valid";
        if (expDate <= today) status = "expired";
        else if (expDate <= in30Days) status = "expiring_soon";

        cardResults.set(fam.family_id, {
          has_card: true,
          card_status: status,
          card_last_four: card.last_4,
          card_brand: card.card_brand,
          exp_month: card.exp_month,
          exp_year: card.exp_year,
          square_verified: true,
        });
      } catch {
        // Network error — fall back to DB data
        cardResults.set(fam.family_id, {
          has_card: !!(fam.square_card_id),
          card_status: fam.square_card_id ? "valid" : "none",
          card_last_four: fam.card_last_four,
          card_brand: fam.card_brand,
          exp_month: fam.card_exp_month,
          exp_year: fam.card_exp_year,
          square_verified: false,
        });
      }
    }));
    // Small delay between batches
    if (i + BATCH < familiesWithSquareId.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Families without Square ID — no card
  for (const fam of familiesWithoutSquareId) {
    cardResults.set(fam.family_id, { has_card: false, card_status: "none", card_last_four: null, card_brand: null, exp_month: null, exp_year: null, square_verified: false });
  }

  // 3. Check subscriptions via Square Subscriptions API
  type SubStatus = {
    has_active_sub: boolean;
    sub_status: string | null;
    plan_name: string | null;
    square_verified: boolean;
  };

  const subResults = new Map<string, SubStatus>();

  for (let i = 0; i < familiesWithSquareId.length; i += BATCH) {
    const batch = familiesWithSquareId.slice(i, i + BATCH);
    await Promise.all(batch.map(async (fam) => {
      const customerId = fam.square_customer_id!;
      try {
        const res = await squarePost("/v2/subscriptions/search", accessToken, {
          query: {
            filter: {
              customer_ids: [customerId],
            },
          },
        });
        const body = res.body as { subscriptions?: Array<{ id: string; status: string; plan_variation_data?: { name?: string } }> };
        const subs = body?.subscriptions ?? [];
        const activeSubs = subs.filter(s => ["ACTIVE", "PAUSED"].includes(s.status?.toUpperCase() ?? ""));

        subResults.set(fam.family_id, {
          has_active_sub: activeSubs.length > 0,
          sub_status: activeSubs[0]?.status ?? (subs[0]?.status ?? null),
          plan_name: activeSubs[0]?.plan_variation_data?.name ?? null,
          square_verified: true,
        });
      } catch {
        subResults.set(fam.family_id, { has_active_sub: false, sub_status: null, plan_name: null, square_verified: false });
      }
    }));
    if (i + BATCH < familiesWithSquareId.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  for (const fam of familiesWithoutSquareId) {
    subResults.set(fam.family_id, { has_active_sub: false, sub_status: null, plan_name: null, square_verified: false });
  }

  // 4. Triage
  type Bucket = "secured" | "at_risk" | "ghost";
  type TriageRow = {
    family_id: string;
    family_name: string;
    contact_name: string;
    email: string;
    square_customer_id: string | null;
    bucket: Bucket;
    ghost_reason: string | null;
    card_status: string;
    card_last_four: string | null;
    card_brand: string | null;
    exp_month: number | null;
    exp_year: number | null;
    has_active_sub: boolean;
    sub_status: string | null;
    autopay_enabled: boolean | null;
    student_count: number;
    students: string[];
  };

  const secured: TriageRow[] = [];
  const atRisk: TriageRow[] = [];
  const ghosts: TriageRow[] = [];

  for (const fam of families) {
    const card = cardResults.get(fam.family_id)!;
    const sub = subResults.get(fam.family_id)!;

    const studentNames = fam.students.map(s => `${s.first_name} ${s.last_name}`.trim());

    const row: TriageRow = {
      family_id: fam.family_id,
      family_name: fam.family_name,
      contact_name: fam.contact_name,
      email: fam.email,
      square_customer_id: fam.square_customer_id,
      bucket: "ghost",
      ghost_reason: null,
      card_status: card.card_status,
      card_last_four: card.card_last_four,
      card_brand: card.card_brand,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      has_active_sub: sub.has_active_sub,
      sub_status: sub.sub_status,
      autopay_enabled: fam.autopay_enabled,
      student_count: fam.students.length,
      students: studentNames,
    };

    if (!fam.square_customer_id) {
      row.bucket = "ghost";
      row.ghost_reason = "No Square customer ID in Ziro";
      ghosts.push(row);
    } else if (!card.has_card) {
      row.bucket = "ghost";
      row.ghost_reason = "No card on file in Square";
      ghosts.push(row);
    } else if (card.card_status === "expired") {
      row.bucket = "at_risk";
      ghosts.push(row); // expired = ghost-level risk
      row.ghost_reason = `Card expired ${card.exp_month}/${card.exp_year}`;
      row.bucket = "ghost";
    } else if (card.card_status === "expiring_soon") {
      row.bucket = "at_risk";
      atRisk.push(row);
    } else if (!sub.has_active_sub) {
      // Has card but no active subscription
      row.bucket = "ghost";
      row.ghost_reason = "Card on file but NO active subscription";
      ghosts.push(row);
    } else {
      // Card valid + active sub = secured
      row.bucket = "secured";
      secured.push(row);
    }
  }

  // Count students in each bucket
  const securedStudents = secured.reduce((acc, f) => acc + f.student_count, 0);
  const atRiskStudents = atRisk.reduce((acc, f) => acc + f.student_count, 0);
  const ghostStudents = ghosts.reduce((acc, f) => acc + f.student_count, 0);

  // Top 10 ghosts by student count (most revenue at risk first)
  const top10Ghosts = [...ghosts]
    .sort((a, b) => b.student_count - a.student_count)
    .slice(0, 10)
    .map(g => ({
      family_name: g.family_name,
      contact_name: g.contact_name,
      students: g.students,
      student_count: g.student_count,
      ghost_reason: g.ghost_reason,
      card_status: g.card_status,
      has_active_sub: g.has_active_sub,
      square_customer_id: g.square_customer_id ? "EXISTS" : "MISSING",
    }));

  return NextResponse.json({
    audit_timestamp: new Date().toISOString(),
    summary: {
      total_active_students: totalStudents,
      total_families: totalFamilies,
      secured_families: secured.length,
      secured_students: securedStudents,
      at_risk_families: atRisk.length,
      at_risk_students: atRiskStudents,
      ghost_families: ghosts.length,
      ghost_students: ghostStudents,
    },
    top_10_ghosts: top10Ghosts,
    at_risk_detail: atRisk.map(f => ({
      family_name: f.family_name,
      contact_name: f.contact_name,
      students: f.students,
      card_last_four: f.card_last_four,
      card_brand: f.card_brand,
      exp_month: f.exp_month,
      exp_year: f.exp_year,
    })),
    ghost_reasons_breakdown: Object.entries(
      ghosts.reduce((acc: Record<string, number>, g) => {
        const key = g.ghost_reason ?? "Unknown";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]),
  });
}
