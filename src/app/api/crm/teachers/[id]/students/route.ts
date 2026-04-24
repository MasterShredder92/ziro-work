import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GHOST_LOCATION_ID = "3a7a997c-7c93-44ef-aec5-a6d706967e5b";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: teacherId } = await ctx.params;
    const tenantId = resolved.context.tenantId ?? DEFAULT_TENANT_ID;
    const supabase = getServiceClient();

    // Query schedules joined with students — schedules is the SSOT for active roster
    const { data, error } = await supabase
      .from("schedules")
      .select(`
        id,
        student_id,
        instrument,
        day_of_week,
        start_time,
        status,
        location_id,
        student:students!schedules_student_id_fkey (
          id,
          first_name,
          last_name,
          display_name,
          status
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("teacher_id", teacherId)
      .eq("status", "active")
      .neq("location_id", GHOST_LOCATION_ID)
      .order("day_of_week", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("[teacher/students GET] supabase error:", JSON.stringify(error));
      throw error;
    }

    // Flatten: merge schedule fields into the student object
    const rows = (data ?? []).map((row) => {
      const s = Array.isArray(row.student) ? row.student[0] : row.student;
      return {
        schedule_id: row.id,
        id: s?.id ?? row.student_id,
        first_name: s?.first_name ?? null,
        last_name: s?.last_name ?? null,
        display_name: s?.display_name ?? null,
        student_status: s?.status ?? null,
        instrument: row.instrument ?? null,
        day_of_week: row.day_of_week ?? null,
        start_time: row.start_time ?? null,
        location_id: row.location_id ?? null,
      };
    });

    // Deduplicate by student_id (a student may have multiple schedule rows)
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
      if (!r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    return ok({ data: unique, count: unique.length });
  } catch (err) {
    return serverError(err);
  }
}
