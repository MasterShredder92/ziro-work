import { NextRequest } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase";
import { getSession } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { NextResponse } from "next/server";
import {
  badRequest,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/http";

function forbidden(error: string) {
  return NextResponse.json({ error }, { status: 403 });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const ChangeTeacherSchema = z.object({
  new_teacher_id: z.string().uuid(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  effective_date: z.string().optional(), // ISO date YYYY-MM-DD; defaults today
});

function teacherDisplayName(t: {
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  if (t.display_name) return t.display_name;
  if (t.first_name && t.last_name) return `${t.first_name} ${t.last_name}`;
  return t.first_name || t.last_name || "Unknown Teacher";
}

/**
 * PATCH /api/students/[id]/teacher
 * Role-gated (director+) student teacher reassignment.
 * Required: { new_teacher_id, reason }. Optional: { effective_date }.
 * Writes immutable audit row to student_events.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return forbidden("Sign-in required");
    if (!roleAtLeast(session.role, "director")) {
      return forbidden(
        "Only owners, admins, company directors and studio directors can change a student's teacher."
      );
    }

    const { id: studentId } = await ctx.params;
    const tenantId = session.tenantId || DEFAULT_TENANT_ID;
    const body = await readJson(req);
    const parsed = ChangeTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const { new_teacher_id, reason, effective_date } = parsed.data;

    const supabase = getServiceClient();

    // 1. Load current student (must exist and belong to tenant)
    const { data: student, error: sErr } = await supabase
      .from("students")
      .select("id, family_id, teacher_id, first_name, last_name, tenant_id")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (sErr) return serverError(sErr);
    if (!student) return notFound("Student not found");

    // 2. Resolve old + new teacher names
    const teacherIds = [student.teacher_id, new_teacher_id].filter(
      (v): v is string => Boolean(v)
    );
    const { data: teachers, error: tErr } = await supabase
      .from("teachers")
      .select("id, display_name, first_name, last_name, is_active, status")
      .eq("tenant_id", tenantId)
      .in("id", teacherIds);
    if (tErr) return serverError(tErr);

    const oldTeacher = teachers?.find((t) => t.id === student.teacher_id) ?? null;
    const newTeacher = teachers?.find((t) => t.id === new_teacher_id) ?? null;
    if (!newTeacher) {
      return badRequest("New teacher not found in this tenant");
    }
    if (newTeacher.is_active === false || newTeacher.status === "inactive") {
      return badRequest("Cannot assign an inactive teacher");
    }
    if (student.teacher_id === new_teacher_id) {
      return badRequest("New teacher is the same as current teacher");
    }

    const oldName = oldTeacher ? teacherDisplayName(oldTeacher) : "Unassigned";
    const newName = teacherDisplayName(newTeacher);
    const effective = (effective_date || new Date().toISOString().slice(0, 10));

    // 3. Update students.teacher_id
    const { error: uErr } = await supabase
      .from("students")
      .update({ teacher_id: new_teacher_id, updated_at: new Date().toISOString() })
      .eq("id", studentId)
      .eq("tenant_id", tenantId);
    if (uErr) return serverError(uErr);

    // 4. Immutable audit log
    const description = `Teacher changed: ${oldName} → ${newName}. Reason: ${reason}. Effective: ${effective}.`;
    await supabase.from("student_events").insert({
      tenant_id: tenantId,
      student_id: studentId,
      family_id: student.family_id,
      event_type: "teacher_changed",
      description,
      source_id: new_teacher_id,
      created_by: session.userId,
      created_by_name: session.userId, // Session has no name; userId acts as identity stamp
      created_by_role: session.role,
    });

    return ok({
      data: {
        student_id: studentId,
        old_teacher_id: student.teacher_id,
        new_teacher_id,
        old_teacher_name: oldName,
        new_teacher_name: newName,
        effective_date: effective,
        reason,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
