import { NextRequest } from "next/server";
import { clientFor } from "@data/_client";
import { ok, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/families/[id]/student-files ─────────────
   Returns all student_files for every student in this family,
   enriched with the student's name.
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: familyId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = clientFor(tenantId);

    // Verify family exists
    const { data: family, error: famErr } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .maybeSingle();
    if (famErr) throw famErr;
    if (!family) return notFound("Family not found");

    // Get all students in this family
    const { data: students, error: studErr } = await supabase
      .from("students")
      .select("id, first_name, last_name")
      .eq("family_id", familyId);
    if (studErr) throw studErr;
    if (!students || students.length === 0) return ok({ items: [] });

    const studentIds = students.map((s) => s.id);
    const studentMap: Record<string, string> = {};
    for (const s of students) {
      studentMap[s.id] = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Student";
    }

    // Fetch all student_files for these students (exclude flagged for deletion)
    const { data: files, error: filesErr } = await supabase
      .from("student_files")
      .select("id, student_id, file_name, file_url, file_size, folder, uploaded_by_role, created_at")
      .in("student_id", studentIds)
      .neq("flagged_for_deletion", true)
      .order("created_at", { ascending: false });
    if (filesErr) throw filesErr;

    const enriched = (files ?? []).map((f) => ({
      ...f,
      student_name: studentMap[f.student_id] ?? "Unknown Student",
    }));

    return ok({ items: enriched });
  } catch (err) {
    return serverError(err instanceof Error ? err.message : "Internal error");
  }
}
