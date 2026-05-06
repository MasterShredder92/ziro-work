import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, notFound, serverError, badRequest } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── GET /api/crm/students/[id]/schedule ─────────────────────────
   Returns schedule_blocks for a specific student, scoped by tenant.
   Used by:
     - CRM student profile (upcoming sessions tab)
     - Agent context (Ruby, scheduling agents)
     - Future: student portal (public-facing upcoming sessions)

   Query params:
     from       ISO date string (default: today)
     to         ISO date string (default: 90 days from today)
     include    "past" | "upcoming" | "all" (default: "upcoming")
     limit      max rows (default: 100, max: 500)

   Data source: schedule_blocks table
     - Filtered by student_id + tenant_id (uuid cast)
     - Joined with teachers (display_name, first_name, last_name)
     - Joined with locations (name, color)
     - Never exposes billing data (invoices, payments, rates)

   NOTE: This route is the canonical source for student session data.
   The schedule page (LocationScheduleGrid / MobileScheduleView) reads
   from the same schedule_blocks table via loadWindowedScheduleData.
   Any block written to schedule_blocks is immediately visible here.
──────────────────────────────────────────────────────── */

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: studentId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = getServiceClient();

    // Validate student exists and belongs to this tenant
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, first_name, last_name, family_id, teacher_id, location_id, instrument, status")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (studentError || !student) {
      return notFound("Student not found");
    }

    // Parse query params
    const url = new URL(req.url);
    const includeParam = url.searchParams.get("include") ?? "upcoming";
    const rawLimit = parseInt(url.searchParams.get("limit") ?? "100", 10);
    const limit = Math.min(Math.max(1, rawLimit), 500);

    // Date range
    const today = new Date().toISOString().split("T")[0]!;
    const defaultTo = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
    const fromDate = url.searchParams.get("from") ?? today;
    const toDate = url.searchParams.get("to") ?? defaultTo;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      return badRequest("Invalid date format. Use YYYY-MM-DD.");
    }

    // Build query against schedule_blocks
    // tenant_id in schedule_blocks is uuid — cast tenantId accordingly
    let query = supabase
      .from("schedule_blocks")
      .select(`
        id,
        block_date,
        start_time,
        end_time,
        block_type,
        status,
        checked_in,
        checked_in_at,
        is_makeup_session,
        is_virtual,
        is_family_callout,
        notes,
        teacher_id,
        location_id
      `)
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId as unknown as string)
      .order("block_date", { ascending: includeParam !== "past" })
      .order("start_time", { ascending: true })
      .limit(limit);

    if (includeParam === "upcoming") {
      query = query.gte("block_date", fromDate).lte("block_date", toDate);
    } else if (includeParam === "past") {
      query = query.lt("block_date", today).gte("block_date", fromDate);
    } else {
      // "all"
      query = query.gte("block_date", fromDate).lte("block_date", toDate);
    }

    const { data: blocks, error: blocksError } = await query;

    if (blocksError) {
      console.error("[student/schedule] blocks query error:", blocksError.message);
      return serverError("Failed to load schedule blocks");
    }

    // Enrich with teacher names (batch lookup — unique teacher IDs only)
    const teacherIds = Array.from(
      new Set((blocks ?? []).map((b) => b.teacher_id).filter(Boolean))
    ) as string[];

    let teacherMap: Record<string, { display_name: string | null; first_name: string | null; last_name: string | null }> = {};
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabase
        .from("teachers")
        .select("id, display_name, first_name, last_name")
        .in("id", teacherIds)
        .eq("tenant_id", tenantId);
      for (const t of teachers ?? []) {
        teacherMap[t.id] = {
          display_name: t.display_name ?? null,
          first_name: t.first_name ?? null,
          last_name: t.last_name ?? null,
        };
      }
    }

    // Enrich with location names (batch lookup — unique location IDs only)
    const locationIds = Array.from(
      new Set((blocks ?? []).map((b) => b.location_id).filter(Boolean))
    ) as string[];

    let locationMap: Record<string, { name: string; color: string | null }> = {};
    if (locationIds.length > 0) {
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name, color")
        .in("id", locationIds)
        .eq("tenant_id", tenantId);
      for (const l of locations ?? []) {
        locationMap[l.id] = { name: l.name ?? l.id, color: l.color ?? null };
      }
    }

    // Shape the response
    const enrichedBlocks = (blocks ?? []).map((b) => {
      const teacher = b.teacher_id ? teacherMap[b.teacher_id] : null;
      const location = b.location_id ? locationMap[b.location_id] : null;
      const teacherDisplayName = teacher
        ? (teacher.display_name || `${teacher.first_name ?? ""} ${teacher.last_name ?? ""}`.trim() || "Staff")
        : "Staff";

      return {
        id: b.id,
        block_date: b.block_date,
        start_time: b.start_time,
        end_time: b.end_time,
        block_type: b.block_type,
        status: b.status,
        checked_in: b.checked_in ?? false,
        checked_in_at: b.checked_in_at ?? null,
        is_makeup_session: b.is_makeup_session ?? false,
        is_virtual: b.is_virtual ?? false,
        is_family_callout: b.is_family_callout ?? false,
        notes: b.notes ?? null,
        teacher: {
          id: b.teacher_id ?? null,
          display_name: teacherDisplayName,
        },
        location: {
          id: b.location_id ?? null,
          name: location?.name ?? "Unknown Location",
          color: location?.color ?? null,
        },
      };
    });

    return ok({
      student_id: studentId,
      student_name: `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim(),
      instrument: student.instrument ?? null,
      status: student.status,
      include: includeParam,
      from: fromDate,
      to: toDate,
      count: enrichedBlocks.length,
      blocks: enrichedBlocks,
    });
  } catch (err) {
    console.error("[student/schedule] unexpected error:", err);
    return serverError("Unexpected error loading student schedule");
  }
}
