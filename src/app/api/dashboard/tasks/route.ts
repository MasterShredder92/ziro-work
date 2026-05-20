import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { serverError } from "@/lib/http";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/tasks
 *
 * Returns actionable task items for the dashboard tasks panel:
 *
 * 1. overdueInvoices — families with open invoices this month
 * 2. uncontactedLeads — leads with status='new' and no last_contact_at
 * 3. capacitySignals — locations with open_time blocks this month
 * 4. topInstruments — active students by instrument (normalized)
 * 5. hiringSignals — days of week with high session load
 */
export async function GET() {
  try {
    const tenantId = await getCRMTenantId();
    const db = await createTenantBoundSupabaseClient({ tenantId });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    const today = now.toISOString().split("T")[0];

    // Run all queries in parallel — no sequential waterfalls
    const [
      invoicesResult,
      leadsResult,
      openBlocksResult,
      studentInstrumentsResult,
      sessionsByDayResult,
      locationsResult,
    ] = await Promise.all([
      // 1. Open invoices this month
      db
        .from("invoices")
        .select("id, family_id, total_cents, balance_cents, due_date, status")
        .eq("tenant_id", tenantId)
        .in("status", ["open"])
        .gte("due_date", monthStart)
        .lte("due_date", monthEnd)
        .order("due_date", { ascending: true }),

      // 2. Uncontacted leads
      db
        .from("leads")
        .select("id, first_name, last_name, student_name, name, instrument, source, created_at, last_contact_at, status")
        .eq("tenant_id", tenantId)
        .eq("status", "new")
        .is("last_contact_at", null)
        .order("created_at", { ascending: true })
        .limit(20),

      // 3. Open time blocks by location this month
      db
        .from("schedule_blocks")
        .select("location_id")
        .eq("tenant_id", tenantId)
        .eq("block_type", "open_time")
        .eq("fifth_week", false)
        .gte("block_date", monthStart)
        .lte("block_date", monthEnd),

      // 4. Active students by instrument
      db
        .from("students")
        .select("instrument")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .not("instrument", "is", null),

      // 5. Billable blocks by day of week this month
      db
        .from("schedule_blocks")
        .select("block_date, teacher_id")
        .eq("tenant_id", tenantId)
        .in("block_type", ["student_session", "first_day", "last_day", "virtual", "meet_greet", "sub"])
        .eq("status", "booked")
        .eq("fifth_week", false)
        .gte("block_date", monthStart)
        .lte("block_date", monthEnd),

      // 6. Location names + colors
      db
        .from("locations")
        .select("id, name, color")
        .eq("tenant_id", tenantId),
    ]);

    if (invoicesResult.error) throw invoicesResult.error;
    if (leadsResult.error) throw leadsResult.error;
    if (openBlocksResult.error) throw openBlocksResult.error;
    if (studentInstrumentsResult.error) throw studentInstrumentsResult.error;
    if (sessionsByDayResult.error) throw sessionsByDayResult.error;

    // ── Family names for overdue invoices ─────────────────────────────
    const overdueInvoices = invoicesResult.data ?? [];
    const familyIds = [...new Set(overdueInvoices.map((i) => i.family_id).filter(Boolean))];
    const familyNames = new Map<string, string>();
    if (familyIds.length > 0) {
      const { data: families } = await db
        .from("families")
        .select("id, name, parent_first_name, parent_last_name")
        .in("id", familyIds);
      for (const f of families ?? []) {
        const displayName =
          f.name ||
          `${f.parent_first_name ?? ""} ${f.parent_last_name ?? ""}`.trim() ||
          "Unknown Family";
        familyNames.set(f.id, displayName);
      }
    }

    const overdueItems = overdueInvoices.map((inv) => ({
      invoiceId: inv.id,
      familyId: inv.family_id,
      familyName: familyNames.get(inv.family_id) ?? "Unknown Family",
      balanceCents: inv.balance_cents ?? inv.total_cents ?? 0,
      dueDate: inv.due_date,
      status: inv.status,
    }));

    // ── Uncontacted leads ─────────────────────────────────────────────
    const uncontactedLeads = (leadsResult.data ?? []).map((l) => ({
      leadId: l.id,
      name: l.student_name || l.name || `${l.first_name ?? ""} ${l.last_name ?? ""}`.trim() || "Unknown",
      instrument: l.instrument ?? null,
      source: l.source ?? null,
      createdAt: l.created_at,
    }));

    // ── Capacity signals ──────────────────────────────────────────────
    const locationMap = new Map((locationsResult.data ?? []).map((l) => [l.id, l]));

    const openSlotsByLocation = new Map<string, number>();
    for (const b of openBlocksResult.data ?? []) {
      if (b.location_id) {
        openSlotsByLocation.set(b.location_id, (openSlotsByLocation.get(b.location_id) ?? 0) + 1);
      }
    }

    const capacitySignals = Array.from(openSlotsByLocation.entries())
      .map(([locId, openSlots]) => ({
        locationId: locId,
        locationName: locationMap.get(locId)?.name ?? "Unknown",
        locationColor: locationMap.get(locId)?.color ?? null,
        openSlots,
      }))
      .sort((a, b) => b.openSlots - a.openSlots);

    // ── Instrument demand ─────────────────────────────────────────────
    const instrumentDemand = new Map<string, number>();
    for (const s of studentInstrumentsResult.data ?? []) {
      const instr = (s.instrument ?? "").toLowerCase().trim();
      if (instr) instrumentDemand.set(instr, (instrumentDemand.get(instr) ?? 0) + 1);
    }
    const topInstruments = Array.from(instrumentDemand.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([instrument, studentCount]) => ({ instrument, studentCount }));

    // ── Hiring signals ────────────────────────────────────────────────
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const sessionCountByDay = new Array(7).fill(0);
    const teachersByDay = new Array(7).fill(null).map(() => new Set<string>());

    for (const b of sessionsByDayResult.data ?? []) {
      const dow = new Date(b.block_date + "T12:00:00Z").getUTCDay();
      sessionCountByDay[dow]++;
      if (b.teacher_id) teachersByDay[dow].add(b.teacher_id);
    }

    const hiringSignals = sessionCountByDay
      .map((sessions, dow) => ({
        dayOfWeek: dow,
        dayName: dayNames[dow],
        sessions,
        uniqueTeachers: teachersByDay[dow].size,
      }))
      .filter((d) => d.sessions > 0)
      .sort((a, b) => b.sessions - a.sessions);

    const payload = {
      overdueInvoices: overdueItems,
      uncontactedLeads,
      capacitySignals,
      topInstruments,
      hiringSignals,
      mtd: { start: monthStart, end: monthEnd, today },
    };

    // 30s cache — stale-while-revalidate 60s
    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return res;
  } catch (err) {
    return serverError(err);
  }
}
