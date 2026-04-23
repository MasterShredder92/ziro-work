import { NextRequest } from "next/server";
import { clientFor } from "@data/_client";
import { ok, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/students/[id]/files ─────────────────────
   Returns all files for a student ordered by created_at desc.
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

    const { data: files, error } = await supabase
      .from("student_files")
      .select("id, file_name, file_size, file_url, folder, created_at, uploaded_by, uploaded_by_role")
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId)
      .eq("flagged_for_deletion", false)
      .order("created_at", { ascending: false });

    if (error) return serverError(error);

    return ok({ data: files ?? [] });
  } catch (err) {
    return serverError(err);
  }
}

/* ── POST /api/crm/students/[id]/files ────────────────────
   Stub: accepts multipart/form-data with a "file" field.
   Supabase Storage upload logic to be wired in next step.
──────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
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

    // Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return ok({ error: "No file provided" }, { status: 400 });
    }

    // TODO: Upload to Supabase Storage bucket "student-files"
    // const arrayBuffer = await file.arrayBuffer();
    // const { data: storageData, error: storageError } = await supabase.storage
    //   .from("student-files")
    //   .upload(`${tenantId}/${studentId}/${Date.now()}_${file.name}`, arrayBuffer, {
    //     contentType: file.type,
    //   });

    // Stub: insert a record with a placeholder URL
    const { data: inserted, error: insertError } = await supabase
      .from("student_files")
      .insert({
        student_id: studentId,
        tenant_id: tenantId,
        file_name: file.name,
        file_size: file.size,
        file_url: "#stub", // replace with storageData.path after storage is wired
        folder: "general",
        uploaded_by: (resolved.context.session as { userId?: string }).userId ?? null,
        uploaded_by_role: (resolved.context.session as { role?: string }).role ?? null,
        flagged_for_deletion: false,
      })
      .select("*")
      .single();

    if (insertError) return serverError(insertError);

    return ok({ data: inserted });
  } catch (err) {
    return serverError(err);
  }
}
