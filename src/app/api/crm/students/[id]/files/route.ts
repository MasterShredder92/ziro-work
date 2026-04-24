import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, created, notFound, serverError, badRequest } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/* ── GET /api/crm/students/[id]/files ─────────────────────
   Returns all files for a student ordered by created_at desc.
   Resolves signed URLs for storage-backed files.
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
      .select("id")
      .eq("id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (studentError) return serverError(studentError);
    if (!student) return notFound();

    const { data: files, error } = await supabase
      .from("student_files")
      .select("id, file_name, file_size, file_url, storage_path, folder, created_at, uploaded_by, uploaded_by_role")
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId)
      .eq("flagged_for_deletion", false)
      .order("created_at", { ascending: false });

    if (error) return serverError(error);

    // Resolve signed URLs for storage-backed files
    const items = await Promise.all(
      (files ?? []).map(async (f) => {
        const path = f.storage_path ?? (f.file_url?.startsWith("storage://") ? f.file_url.replace("storage://", "") : null);
        if (path) {
          const { data: signed, error: signErr } = await supabase.storage
            .from("student-files")
            .createSignedUrl(path, 3600);
          return { ...f, file_url: signErr || !signed ? null : signed.signedUrl };
        }
        if (!f.file_url || f.file_url === "#stub" || f.file_url.startsWith("stub://")) {
          return { ...f, file_url: null };
        }
        return f;
      })
    );

    return ok({ data: items });
  } catch (err) {
    return serverError(err);
  }
}

/* ── POST /api/crm/students/[id]/files ────────────────────
   Uploads a file for a student to Supabase Storage.
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return badRequest("No file provided");

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${tenantId}/${studentId}/${Date.now()}_${safeName}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: storageErr } = await supabase.storage
      .from("student-files")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (storageErr) throw new Error(`Storage upload failed: ${storageErr.message}`);

    // Generate 1-hour signed URL for immediate display
    const { data: signed, error: signErr } = await supabase.storage
      .from("student-files")
      .createSignedUrl(storagePath, 3600);

    const { data: inserted, error: insertError } = await supabase
      .from("student_files")
      .insert({
        student_id: studentId,
        tenant_id: tenantId,
        file_name: file.name,
        file_size: file.size,
        file_url: `storage://${storagePath}`,
        storage_path: storagePath,
        folder: "general",
        uploaded_by: (session as { userId?: string }).userId ?? null,
        uploaded_by_role: (session as { role?: string }).role ?? null,
        flagged_for_deletion: false,
      })
      .select("*")
      .single();

    if (insertError) return serverError(insertError);
    return created({ data: { ...inserted, file_url: signErr || !signed ? null : signed.signedUrl } });
  } catch (err) {
    return serverError(err);
  }
}

/* ── DELETE /api/crm/students/[id]/files?fileId=xxx ───────
   Deletes a student_file record and its storage object.
──────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;

  try {
    const { id: studentId } = await ctx.params;
    const { tenantId } = resolved.context;
    const supabase = getServiceClient();
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    if (!fileId) return badRequest("fileId is required");

    const { data: fileRecord, error: fetchErr } = await supabase
      .from("student_files")
      .select("id, file_url, storage_path, student_id")
      .eq("id", fileId)
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (fetchErr) return serverError(fetchErr);
    if (!fileRecord) return notFound();

    // Delete from storage if backed
    const storagePath = fileRecord.storage_path ?? (fileRecord.file_url?.startsWith("storage://") ? fileRecord.file_url.replace("storage://", "") : null);
    if (storagePath) {
      const { error: storageErr } = await supabase.storage
        .from("student-files")
        .remove([storagePath]);
      if (storageErr) console.warn("Storage delete warning:", storageErr.message);
    }

    const { error: deleteErr } = await supabase
      .from("student_files")
      .delete()
      .eq("id", fileId)
      .eq("student_id", studentId)
      .eq("tenant_id", tenantId);
    if (deleteErr) return serverError(deleteErr);

    return ok({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
