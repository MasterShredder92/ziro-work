import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// Block types that count toward teacher tally / payroll
export const BILLABLE_BLOCK_TYPES = [
  "student_session",
  "makeup_session",
  "first_day",
  "last_day",
  "meet_greet",
  "sub",
  "virtual",
] as const;

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: teacherId } = await ctx.params;
    const { tenantId } = resolved.context;
    const url = new URL(req.url);

    // Default: current calendar month
    const now = new Date();
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const defaultEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;

    const startDate = url.searchParams.get("start") ?? defaultStart;
    const endDate = url.searchParams.get("end") ?? defaultEnd;

    const supabase = getServiceClient();

    // Tally by location — only checked-in blocks with teacher_tally = true
    const { data: rows, error } = await supabase
      .from("schedule_blocks")
      .select(`
        id,
        block_type,
        block_date,
        start_time,
        end_time,
        location_id,
        checked_in,
        teacher_tally,
        locations!inner(id, name, color)
      `)
      .eq("tenant_id", tenantId)
      .eq("teacher_id", teacherId)
      .eq("checked_in", true)
      .eq("teacher_tally", true)
      .gte("block_date", startDate)
      .lt("block_date", endDate)
      .in("block_type", BILLABLE_BLOCK_TYPES as unknown as string[])
      .order("block_date", { ascending: true });

    if (error) return serverError(error);

    // Fetch teacher pay rate
    const { data: teacher } = await supabase
      .from("teachers")
      .select("pay_rate_per_half_hour, first_name, last_name, display_name")
      .eq("id", teacherId)
      .single();

    const payRate = Number(teacher?.pay_rate_per_half_hour ?? 0);

    // Aggregate by location
    const byLocation: Record<string, {
      location_id: string;
      location_name: string;
      location_color: string;
      session_count: number;
      half_hour_blocks: number;
      earned: number;
    }> = {};

    let totalSessions = 0;
    let totalHalfHours = 0;

    for (const row of rows ?? []) {
      const loc = row.locations as unknown as { id: string; name: string; color: string };
      const locId = loc.id;
      if (!byLocation[locId]) {
        byLocation[locId] = {
          location_id: locId,
          location_name: loc.name,
          location_color: loc.color ?? "#00ff88",
          session_count: 0,
          half_hour_blocks: 0,
          earned: 0,
        };
      }

      // Each session is 1 block. Duration in half-hours:
      const [sh = "0", sm = "0"] = (row.start_time as string).split(":");
      const [eh = "0", em = "0"] = (row.end_time as string).split(":");
      const startMin = parseInt(sh) * 60 + parseInt(sm);
      const endMin = parseInt(eh) * 60 + parseInt(em);
      const halfHours = Math.max(1, (endMin - startMin) / 30);

      byLocation[locId].session_count += 1;
      byLocation[locId].half_hour_blocks += halfHours;
      byLocation[locId].earned += halfHours * payRate;

      totalSessions += 1;
      totalHalfHours += halfHours;
    }

    return ok({
      data: {
        teacher_id: teacherId,
        teacher_name: teacher?.display_name ?? [teacher?.first_name, teacher?.last_name].filter(Boolean).join(" ") ?? "Unknown",
        pay_rate_per_half_hour: payRate,
        period_start: startDate,
        period_end: endDate,
        total_sessions: totalSessions,
        total_half_hours: totalHalfHours,
        total_earned: totalHalfHours * payRate,
        by_location: Object.values(byLocation).sort((a, b) => b.session_count - a.session_count),
        billable_block_types: BILLABLE_BLOCK_TYPES,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
