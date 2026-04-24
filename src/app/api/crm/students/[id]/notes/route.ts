import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, created, notFound, serverError, badRequest } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/students/[id]/notes ─────────────────────
   Returns all notes for a student ordered by created_at desc.
   Also used by family-level feed: ?family_id=xxx returns notes
   for all students in that family (filtered by student_id).
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
    const supabase = getServiceClient();

    // Verify student belongs to this tenant
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id, family_id")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (studentError) return serverError(studentError);
    if (!student) return notFound();

    const { data: notes, error } = await supabase
      .from("student_notes")
      .select("id, student_id, author_id, author_name, author_role, body, created_at, updated_at")
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) return serverError(error);
    return ok({ data: notes ?? [], student_id: studentId, family_id: student.family_id });
  } catch (err) {
    return serverError(err);
  }
}

/* ── POST /api/crm/students/[id]/notes ────────────────────
   Creates a new note for a student.
   Body: { body: string; note_type?: string }
──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: studentId } = await ctx.params;
    const { tenantId, session } = resolved.context;
    const supabase = getServiceClient();

    // Verify student belongs to this tenant
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (studentError) return serverError(studentError);
    if (!student) return notFound();

    const body = await req.json().catch(() => null);
    if (!body?.body || typeof body.body !== "string" || !body.body.trim()) {
      return badRequest("Note body is required");
    }
    const VALID_NOTE_TYPES = ["internal_studio", "teacher_lesson", "parent_comm"];
    const noteType: string = VALID_NOTE_TYPES.includes(body.note_type) ? body.note_type : "internal_studio";

    // Resolve author name from profiles
    const authorId = (session as { userId?: string }).userId ?? null;
    let authorName: string | null = null;
    let authorRole: string | null = (session as { role?: string }).role ?? null;
    if (authorId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("id", authorId)
        .maybeSingle();
      if (profile) {
        authorName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null;
        authorRole = profile.role ?? authorRole;
      }
    }

    const { data: note, error: insertError } = await supabase
      .from("student_notes")
      .insert({
        tenant_id: tenantId,
        student_id: studentId,
        author_id: authorId,
        author_name: authorName,
        author_role: authorRole,
        body: body.body.trim(),
        note_type: noteType,
      })
      .select("*")
      .single();

    if (insertError) return serverError(insertError);
    return created({ data: note });
  } catch (err) {
    return serverError(err);
  }
}

/* ── DELETE /api/crm/students/[id]/notes?noteId=xxx ───────
   Deletes a specific note. Only author or admin can delete.
──────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: studentId } = await ctx.params;
    const { tenantId, session } = resolved.context;
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");
    if (!noteId) return badRequest("noteId is required");

    const authorId = (session as { userId?: string }).userId ?? null;
    const role = (session as { role?: string }).role ?? "teacher";

    // Fetch note to verify ownership
    const { data: note, error: fetchErr } = await supabase
      .from("student_notes")
      .select("id, author_id, student_id")
      .eq("id", noteId)
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (fetchErr) return serverError(fetchErr);
    if (!note) return notFound();

    // Only author or admin/director can delete
    if (note.author_id !== authorId && role !== "admin" && role !== "director") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error: deleteErr } = await supabase
      .from("student_notes")
      .delete()
      .eq("id", noteId)
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId);
    if (deleteErr) return serverError(deleteErr);

    return ok({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
