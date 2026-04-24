import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/families/[id]/teachers ──────────────────
   Returns deduplicated teacher profiles for all students in
   this family. Each teacher includes which students they teach.
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "family",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: familyId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = getServiceClient();

    // Verify family belongs to this tenant
    const { data: family, error: familyError } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (familyError) return serverError(familyError);
    if (!family) return notFound();

    // Get all students in this family with their teacher_id
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("id, first_name, last_name, teacher_id")
      .eq("family_id", familyId)
      .eq("tenant_id", tenantId)
      .eq("status", "active");
    if (studentsError) return serverError(studentsError);
    if (!students || students.length === 0) return ok({ data: [] });

    // Collect unique teacher IDs
    const teacherIds = [...new Set(
      students.map((s) => s.teacher_id).filter(Boolean) as string[]
    )];
    if (teacherIds.length === 0) return ok({ data: [] });

    // Fetch teacher profiles
    const { data: teachers, error: teachersError } = await supabase
      .from("teachers")
      .select(
        "id, first_name, last_name, display_name, bio, photo_url, " +
        "teacher_role, instruments, lesson_style, customer_facing_match_summary"
      )
      .in("id", teacherIds)
      .eq("tenant_id", tenantId);
    if (teachersError) return serverError(teachersError);

    // Build teacher → student names map
    const teacherStudentMap: Record<string, string[]> = {};
    for (const student of students) {
      if (!student.teacher_id) continue;
      if (!teacherStudentMap[student.teacher_id]) {
        teacherStudentMap[student.teacher_id] = [];
      }
      const name = [student.first_name, student.last_name].filter(Boolean).join(" ");
      if (name) teacherStudentMap[student.teacher_id].push(name);
    }

    // Merge teacher data with student list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = ((teachers ?? []) as any[]).map((t: any) => ({
      id: t.id,
      full_name: t.display_name ?? [t.first_name, t.last_name].filter(Boolean).join(" ") ?? "Unknown Teacher",
      bio: t.bio ?? t.customer_facing_match_summary ?? null,
      photo_url: t.photo_url ?? null,
      teacher_role: t.teacher_role ?? "Music Teacher",
      instruments: t.instruments ?? [],
      lesson_style: t.lesson_style ?? null,
      teaches_students: teacherStudentMap[t.id] ?? [],
    }));

    return ok({ data: result, family_id: familyId });
  } catch (err) {
    return serverError(err);
  }
}
