import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
import { getServiceClient } from "@/lib/supabase";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: teacherId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = getServiceClient();

    // students.teacher_id is the SSOT — query directly, no schedules join needed
    const { data, error } = await supabase
      .from("students")
      .select(
        "id, first_name, last_name, status, instrument, location_id, lesson_day_of_week, blocks_per_week, experience_level, archived_at"
      )
      .eq("tenant_id", tenantId)
      .eq("teacher_id", teacherId)
      .is("archived_at", null)
      .order("first_name", { ascending: true });

    if (error) {
      console.error("[teacher/students GET] supabase error:", JSON.stringify(error));
      throw error;
    }

    const rows = (data ?? []).map((s) => ({
      id: s.id,
      first_name: s.first_name ?? null,
      last_name: s.last_name ?? null,
      display_name: [s.first_name, s.last_name].filter(Boolean).join(" ") || null,
      student_status: s.status ?? null,
      instrument: s.instrument ?? null,
      day_of_week: s.lesson_day_of_week ?? null,
      location_id: s.location_id ?? null,
      blocks_per_week: s.blocks_per_week ?? null,
      experience_level: s.experience_level ?? null,
    }));

    return ok({ data: rows, count: rows.length });
  } catch (err) {
    return serverError(err);
  }
}
