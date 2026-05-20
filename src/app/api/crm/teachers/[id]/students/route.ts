/**
 * GET /api/crm/teachers/:id/students
 *
 * Returns the unique roster of students on this teacher's schedule.
 * Primary source: schedule_blocks (status = 'booked') — deduped by student_id.
 * Fallback: students.teacher_id — for teachers with no schedule_blocks yet.
 */
import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function buildRow(s: {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  status?: string | null;
  instrument?: string | null;
  location_id?: string | null;
  lesson_day_of_week?: number | null;
  blocks_per_week?: number | null;
  experience_level?: string | null;
  archived_at?: string | null;
}) {
  return {
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
  };
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: teacherId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = await createTenantBoundSupabaseClient({ tenantId: resolved.context.tenantId });

    // Step 1: get distinct booked student_ids from schedule_blocks
    const { data: blocks, error: blocksError } = await supabase
      .from("schedule_blocks")
      .select("student_id")
      .eq("tenant_id", tenantId)
      .eq("teacher_id", teacherId)
      .eq("status", "booked")
      .not("student_id", "is", null);

    if (blocksError) {
      console.error("[teacher/students GET] blocks error:", JSON.stringify(blocksError));
      throw blocksError;
    }

    const studentIds = [...new Set((blocks ?? []).map((b) => b.student_id as string).filter(Boolean))];

    let rows: ReturnType<typeof buildRow>[] = [];

    if (studentIds.length > 0) {
      // Step 2: fetch those students
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, status, instrument, location_id, lesson_day_of_week, blocks_per_week, experience_level, archived_at"
        )
        .in("id", studentIds)
        .is("archived_at", null)
        .order("first_name", { ascending: true });

      if (studentsError) {
        console.error("[teacher/students GET] students fetch error:", JSON.stringify(studentsError));
        throw studentsError;
      }

      rows = (students ?? []).map(buildRow);
    } else {
      // Fallback: teacher has no schedule_blocks yet — use students.teacher_id
      const { data: directStudents, error: directError } = await supabase
        .from("students")
        .select(
          "id, first_name, last_name, status, instrument, location_id, lesson_day_of_week, blocks_per_week, experience_level, archived_at"
        )
        .eq("tenant_id", tenantId)
        .eq("teacher_id", teacherId)
        .is("archived_at", null)
        .order("first_name", { ascending: true });

      if (directError) {
        console.error("[teacher/students GET] fallback error:", JSON.stringify(directError));
        throw directError;
      }

      rows = (directStudents ?? []).map(buildRow);
    }

    return ok({ data: rows, count: rows.length });
  } catch (err) {
    return serverError(err);
  }
}
