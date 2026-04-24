import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, created, notFound, badRequest, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/students/[id]/notes ─────────────────────
   Returns all notes (plain + lesson cards) for a student.
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
      .select(
        "id, student_id, author_id, author_name, author_role, body, note_type, " +
        "is_lesson_card, prompt_context, prompt_assignment, prompt_focus, " +
        "file_url, file_name, file_size, created_at, updated_at"
      )
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
   Two modes:
   1. Plain note (JSON):  { body, note_type? }
   2. Lesson card (multipart/form-data):
      Fields: file (optional), prompt_context*, prompt_assignment*, prompt_focus*
      All 3 prompts are REQUIRED when submitting a lesson card.
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

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (studentError) return serverError(studentError);
    if (!student) return notFound();

    // Resolve author
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

    const contentType = req.headers.get("content-type") ?? "";

    // ── Lesson Card path (multipart) ────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const promptContext    = (form.get("prompt_context")    as string | null)?.trim() ?? "";
      const promptAssignment = (form.get("prompt_assignment") as string | null)?.trim() ?? "";
      const promptFocus      = (form.get("prompt_focus")      as string | null)?.trim() ?? "";
      const file             = form.get("file") as File | null;

      // Gate: all 3 prompts required
      if (!promptContext)    return badRequest("prompt_context is required");
      if (!promptAssignment) return badRequest("prompt_assignment is required");
      if (!promptFocus)      return badRequest("prompt_focus is required");

      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `student-files/${tenantId}/${studentId}/${Date.now()}_${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from("student-files")
          .upload(storagePath, buffer, { contentType: file.type, upsert: false });
        if (uploadErr) return serverError(uploadErr);
        const { data: urlData } = supabase.storage
          .from("student-files")
          .getPublicUrl(storagePath);
        fileUrl  = urlData?.publicUrl ?? null;
        fileName = file.name;
        fileSize = file.size;
      }

      const body = [
        `Context: ${promptContext}`,
        `Assignment: ${promptAssignment}`,
        `Focus: ${promptFocus}`,
      ].join("\n\n");

      const { data: note, error: insertError } = await supabase
        .from("student_notes")
        .insert({
          tenant_id:         tenantId,
          student_id:        studentId,
          author_id:         authorId,
          author_name:       authorName,
          author_role:       authorRole,
          body,
          note_type:         "teacher_lesson",
          is_lesson_card:    true,
          prompt_context:    promptContext,
          prompt_assignment: promptAssignment,
          prompt_focus:      promptFocus,
          file_url:          fileUrl,
          file_name:         fileName,
          file_size:         fileSize,
        })
        .select("*")
        .single();
      if (insertError) return serverError(insertError);
      return created({ data: note });
    }

    // ── Plain note path (JSON) ──────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body?.body || typeof body.body !== "string" || !body.body.trim()) {
      return badRequest("Note body is required");
    }
    const VALID_NOTE_TYPES = ["internal_studio", "teacher_lesson", "parent_comm"];
    const noteType: string = VALID_NOTE_TYPES.includes(body.note_type) ? body.note_type : "internal_studio";

    const { data: note, error: insertError } = await supabase
      .from("student_notes")
      .insert({
        tenant_id:      tenantId,
        student_id:     studentId,
        author_id:      authorId,
        author_name:    authorName,
        author_role:    authorRole,
        body:           body.body.trim(),
        note_type:      noteType,
        is_lesson_card: false,
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

    const { data: note, error: fetchErr } = await supabase
      .from("student_notes")
      .select("id, author_id, student_id")
      .eq("id", noteId)
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (fetchErr) return serverError(fetchErr);
    if (!note) return notFound();

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
