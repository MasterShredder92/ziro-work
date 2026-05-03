import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "@/app/api/crm/_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/tasks
 *
 * Returns actionable task items for the dashboard tasks panel:
 *
 * 1. overdueInvoices — families with open/overdue invoices this month
 * 2. uncontactedLeads — leads with status='new' and no last_contacted_at
 * 3. capacitySignals — locations with open_time blocks this month +
 *    instrument demand gaps (instruments with active students but
 *    low teacher coverage)
 * 4. hiringSignals — days of week with low teacher coverage
 */
export async function GET(req: NextRequest) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { tenantId } = resolved.context;
    const db = getServiceClient();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    const today = now.toISOString().split("T")[0];

    // ── 1. Overdue invoices this month ─────────────────────────────
    const { data: overdueInvoices, error: invErr } = await db
      .from("invoices")
      .select("id, family_id, total_cents, balance_cents, due_date, status")
      .eq("tenant_id", tenantId)
      .in("status", ["open"])
      .gte("due_date", monthStart)
      .lte("due_date", monthEnd)
      .order("due_date", { ascending: true });

    if (invErr) throw invErr;

    // Get family names for overdue invoices
    const familyIds = [...new Set((overdueInvoices ?? []).map((i) => i.family_id).filter(Boolean))];
    let familyNames: Map<string, string> = new Map();
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

    const overdueItems = (overdueInvoices ?? []).map((inv) => ({
      invoiceId: inv.id,
      familyId: inv.family_id,
      familyName: familyNames.get(inv.family_id) ?? "Unknown Family",
      balanceCents: inv.balance_cents ?? inv.total_cents ?? 0,
      dueDate: inv.due_date,
      status: inv.status,
    }));

    // ── 2. Uncontacted leads ───────────────────────────────────────
    const { data: leads, error: leadsErr } = await db
      .from("leads")
      .select("id, first_name, last_name, student_name, name, instrument, source, created_at, last_contact_at, status")
      .eq("tenant_id", tenantId)
      .eq("status", "new")
      .is("last_contact_at", null)
      .order("created_at", { ascending: true })
      .limit(20);

    if (leadsErr) throw leadsErr;

    const uncontactedLeads = (leads ?? []).map((l) => ({
      leadId: l.id,
      name: l.student_name || l.name || `${l.first_name ?? ""} ${l.last_name ?? ""}`.trim() || "Unknown",
      instrument: l.instrument ?? null,
      source: l.source ?? null,
      createdAt: l.created_at,
    }));

    // ── 3. Open capacity signals ───────────────────────────────────
    // Count open_time blocks per location this month
    const { data: openBlocks, error: openErr } = await db
      .from("schedule_blocks")
      .select("location_id")
      .eq("tenant_id", tenantId)
      .eq("block_type", "open_time")
      .eq("fifth_week", false)
      .gte("block_date", monthStart)
      .lte("block_date", monthEnd);

    if (openErr) throw openErr;

    // Count active students per instrument (normalized to lowercase)
    const { data: studentInstruments, error: instrErr } = await db
      .from("students")
      .select("instrument, location_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .not("instrument", "is", null);

    if (instrErr) throw instrErr;

    // Normalize instrument names and count demand
    const instrumentDemand = new Map<string, number>();
    for (const s of studentInstruments ?? []) {
      const instr = (s.instrument ?? "").toLowerCase().trim();
      if (instr) {
        instrumentDemand.set(instr, (instrumentDemand.get(instr) ?? 0) + 1);
      }
    }

    // Count open slots per location
    const openSlotsByLocation = new Map<string, number>();
    for (const b of openBlocks ?? []) {
      if (b.location_id) {
        openSlotsByLocation.set(b.location_id, (openSlotsByLocation.get(b.location_id) ?? 0) + 1);
      }
    }

    // Fetch location names
    const { data: locations } = await db
      .from("locations")
      .select("id, name, color")
      .eq("tenant_id", tenantId);

    const locationMap = new Map((locations ?? []).map((l) => [l.id, l]));

    const capacitySignals = Array.from(openSlotsByLocation.entries())
      .map(([locId, openSlots]) => ({
        locationId: locId,
        locationName: locationMap.get(locId)?.name ?? "Unknown",
        locationColor: locationMap.get(locId)?.color ?? null,
        openSlots,
      }))
      .sort((a, b) => b.openSlots - a.openSlots);

    // All instruments by demand — normalized, sorted desc (chart + hiring suggestions)
    const topInstruments = Array.from(instrumentDemand.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([instrument, studentCount]) => ({ instrument, studentCount }));

    // ── 4. Hiring signals — days with low coverage ─────────────────
    // Count booked billable blocks by day of week this month
    const BILLABLE_TYPES = ["student_session", "first_day", "last_day", "virtual", "meet_greet", "sub"];
    const { data: sessionsByDay, error: dayErr } = await db
      .from("schedule_blocks")
      .select("block_date, teacher_id")
      .eq("tenant_id", tenantId)
      .in("block_type", BILLABLE_TYPES)
      .eq("status", "booked")
      .eq("fifth_week", false)
      .gte("block_date", monthStart)
      .lte("block_date", monthEnd);

    if (dayErr) throw dayErr;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const sessionCountByDay = new Array(7).fill(0);
    const teachersByDay = new Array(7).fill(null).map(() => new Set<string>());

    for (const b of sessionsByDay ?? []) {
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

    return ok({
      overdueInvoices: overdueItems,
      uncontactedLeads,
      capacitySignals,
      topInstruments,
      hiringSignals,
      mtd: { start: monthStart, end: monthEnd, today },
    });
  } catch (err) {
    return serverError(err);
  }
}
