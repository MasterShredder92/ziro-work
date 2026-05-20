import { NextRequest } from "next/server";
import { z } from "zod";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
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
 * Role-gated (director+) permanent student teacher reassignment.
 * Required: { new_teacher_id, reason }. Optional: { effective_date }.
 *
 * What this does (in order):
 *   1. Validates session + role (director+)
 *   2. Loads current student + resolves old/new teacher names
 *   3. Updates students.teacher_id → new teacher
 *   4. CASCADE: Updates all future schedule_blocks for this student
 *      (block_date >= effective_date) to the new teacher_id.
 *      - Excludes call_out and not_bookable blocks (those are ops-level, not student-teacher)
 *      - Past blocks (block_date < effective_date) are NEVER touched — historical accuracy
 *   5. Writes immutable audit row to student_events
 *
 * NOTE: Sub / temp teacher changes are handled at the block level on the schedule page.
 * This route is ONLY for permanent teacher reassignments at the student record level.
 * Do NOT add any other block-level teacher logic here — it belongs on the schedule.
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
    const effective = effective_date || new Date().toISOString().slice(0, 10);

    const supabase = await createTenantBoundSupabaseClient({ tenantId });

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

    // 3. Update students.teacher_id
    const { error: uErr } = await supabase
      .from("students")
      .update({ teacher_id: new_teacher_id, updated_at: new Date().toISOString() })
      .eq("id", studentId)
      .eq("tenant_id", tenantId);
    if (uErr) return serverError(uErr);

    // 4. CASCADE: Update all future schedule_blocks for this student to the new teacher.
    //    - Only blocks on or after the effective date
    //    - Excludes call_out and not_bookable (ops-level blocks, not student-teacher assignments)
    //    - Past blocks are never touched — they reflect who actually taught those sessions
    const { data: cascadeResult, error: cascadeErr } = await supabase
      .from("schedule_blocks")
      .update({ teacher_id: new_teacher_id })
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId as unknown as string)
      .gte("block_date", effective)
      .not("block_type", "in", '("call_out","not_bookable")')
      .select("id");

    const blocksUpdated = cascadeResult?.length ?? 0;

    if (cascadeErr) {
      // Non-fatal: student record already updated. Log the error but don't fail the request.
      // The audit log will note the cascade failure count.
      console.error(
        `[teacher/change] cascade block update failed for student ${studentId}:`,
        cascadeErr.message
      );
    }

    // 5. Immutable audit log — includes cascade block count for full traceability
    const description = [
      `Teacher changed: ${oldName} → ${newName}.`,
      `Reason: ${reason}.`,
      `Effective: ${effective}.`,
      cascadeErr
        ? `Schedule cascade FAILED (${cascadeErr.message}) — future blocks may still reference old teacher.`
        : `${blocksUpdated} future schedule block(s) reassigned to new teacher.`,
    ].join(" ");

    await supabase.from("student_events").insert({
      tenant_id: tenantId,
      student_id: studentId,
      family_id: student.family_id,
      event_type: "teacher_changed",
      description,
      source_id: new_teacher_id,
      created_by: session.userId,
      created_by_name: session.userId,
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
        blocks_cascaded: blocksUpdated,
        cascade_error: cascadeErr?.message ?? null,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
