import { NextRequest } from "next/server";
import { clientFor } from "@data/_client";
import { ok, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/students/[id]/timeline ──────────────────
   Returns session_log entries for a student, newest first.
──────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: studentId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = clientFor(tenantId);

    // Verify student belongs to this tenant
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (studentError) return serverError(studentError);
    if (!student) return notFound();

    const { data: logs, error } = await supabase
      .from("session_log")
      .select(
        "id, block_date, status, notes, teacher_note, lesson_notes, engagement_level, progress_indicator, instrument, worked_on, created_at"
      )
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId)
      .is("archived_at", null)
      .order("block_date", { ascending: false });

    if (error) return serverError(error);

    return ok({ data: logs ?? [] });
  } catch (err) {
    return serverError(err);
  }
}
